import numpy as np
import sounddevice as sd
import time
import sys
from collections import deque

# ============ 配置区 ============
TARGET_DEVICE_NAME = (
    "Voicemeeter Out B1 (VB-Audio Voicemeeter VAIO)"  # 虚拟声卡名称（部分匹配即可）
)
TARGET_SAMPLE_RATE = 16000  # RealTimeSTT 期望的采样率
TARGET_CHANNELS = 1  # STT 通常为单声道
TEST_DURATION = 10  # 测试时长(秒)
SILENCE_THRESHOLD = 0.001  # 静音判定阈值
MIN_VALID_CHUNK_MS = 30  # 最小有效片段(ms)，对应STT的min_length
# ================================


def find_device(name_keyword: str) -> dict | None:
    """查找匹配的音频输入设备，遇到重名时自动选择第一个"""
    devices = sd.query_devices()
    matched_devices = []

    print(f"\n📋 所有音频输入设备:")
    for i, d in enumerate(devices):
        is_input = d["max_input_channels"] > 0
        is_match = name_keyword.lower() in d["name"].lower() and is_input

        marker = ""
        if is_match:
            matched_devices.append((i, d))
            # 仅给第一个匹配的设备打上推荐标记
            marker = (
                " ✅ (将使用此设备)"
                if len(matched_devices) == 1
                else " ⚠️ (重名，已跳过)"
            )

        if is_input:
            print(
                f"  [{i}] {d['name']} | 输入通道:{d['max_input_channels']} | "
                f"默认采样率:{d['default_samplerate']}{marker}"
            )

    if not matched_devices:
        return None

    # 始终返回第一个匹配的设备
    selected_index, selected_device = matched_devices[0]
    if len(matched_devices) > 1:
        print(
            f"\n💡 检测到 {len(matched_devices)} 个同名设备，已自动选择第一个: [{selected_index}]"
        )

    return selected_device


def validate_device_config(device: dict) -> bool:
    """验证设备配置是否与STT要求匹配"""
    print(f"\n⚙️  配置验证:")
    ok = True

    # 采样率检查
    native_sr = device["default_samplerate"]
    if abs(native_sr - TARGET_SAMPLE_RATE) > 1:
        print(
            f"  ❌ 采样率不匹配! 设备原生={native_sr}Hz, STT期望={TARGET_SAMPLE_RATE}Hz"
        )
        print(f"     → 运行时重采样会导致时序偏移，产生过短chunk!")
        print(f"     → 请在系统声音设置中将虚拟声卡设为 {TARGET_SAMPLE_RATE}Hz")
        ok = False
    else:
        print(f"  ✅ 采样率匹配: {native_sr}Hz")

    # 通道数检查
    if device["max_input_channels"] != TARGET_CHANNELS:
        print(
            f"  ⚠️  通道数不一致: 设备={device['max_input_channels']}ch, STT期望={TARGET_CHANNELS}ch"
        )
        print(f"     → sounddevice会自动downmix，但建议确认虚拟声卡输出格式")
    else:
        print(f"  ✅ 通道数匹配: {TARGET_CHANNELS}ch")

    return ok


# ✅ 将参数 device_name 改为 device_index
def test_capture(device_index: int, sample_rate: int, channels: int, duration: float):
    """核心采集测试：验证数据有效性和实时性"""
    print(f"\n🎤 开始采集测试 ({duration}s @ {sample_rate}Hz/{channels}ch)...")
    print(f"   💡 请现在对着虚拟声卡的输入端播放/说话...\n")

    chunk_size = int(sample_rate * 0.03)
    buffer = deque(maxlen=int(duration / 0.03))
    timestamps = []
    errors = []

    def callback(indata, frames, time_info, status):
        if status:
            errors.append(str(status))
        timestamps.append(time.time())
        buffer.append(indata.copy().flatten())

    try:
        with sd.InputStream(
            samplerate=sample_rate,
            channels=channels,
            blocksize=chunk_size,
            device=device_index,
            dtype="float32",
            callback=callback,
        ):
            start = time.time()
            while time.time() - start < duration:
                elapsed = time.time() - start
                level = np.abs(buffer[-1]).mean() if buffer else 0
                bar = "█" * int(level * 500) + "░" * max(0, 50 - int(level * 500))
                print(
                    f"\r   [{elapsed:5.1f}s] Level: {level:.4f} |{bar}|",
                    end="",
                    flush=True,
                )
                time.sleep(0.03)
    except Exception as e:
        print(f"\n❌ 采集失败: {e}")
        return False

    print("\n")

    # ---- 分析结果 ----
    chunks = list(buffer)
    total_chunks = len(chunks)
    expected_chunks = int(duration / 0.03)

    print(f"📊 采集结果分析:")
    print(
        f"  收到chunks: {total_chunks}/{expected_chunks} "
        f"({'✅' if total_chunks >= expected_chunks * 0.9 else '❌ 丢帧严重'})"
    )

    # 1. 静音检测
    silent_chunks = sum(1 for c in chunks if np.abs(c).mean() < SILENCE_THRESHOLD)
    silent_ratio = silent_chunks / max(total_chunks, 1)
    print(
        f"  静音chunks: {silent_chunks}/{total_chunks} ({silent_ratio:.0%}) "
        f"{'⚠️ 全静音!检查虚拟声卡路由' if silent_ratio > 0.95 else '✅'}"
    )

    # 2. 峰值电平
    peak = max(np.abs(c).max() for c in chunks) if chunks else 0
    print(
        f"  峰值电平: {peak:.4f} "
        f"{'❌ 削波!' if peak > 0.99 else '⚠️ 信号弱' if peak < 0.01 else '✅'}"
    )

    # 3. 实时性(jitter)分析
    if len(timestamps) > 1:
        intervals = np.diff(timestamps)
        expected_interval = 0.03
        jitter_ms = np.std(intervals) * 1000
        max_gap_ms = np.max(intervals) * 1000
        print(
            f"  时间抖动: {jitter_ms:.1f}ms (std), 最大间隔: {max_gap_ms:.1f}ms "
            f"{'✅' if max_gap_ms < 100 else '❌ 间隔过大→队列堆积元凶'}"
        )

    # 4. 过短chunk模拟检测
    min_samples = int(sample_rate * MIN_VALID_CHUNK_MS / 1000)
    short_chunks = sum(1 for c in chunks if len(c) < min_samples)
    print(
        f"  过短chunks(<{MIN_VALID_CHUNK_MS}ms): {short_chunks} "
        f"{'❌ 这就是too short报错来源!' if short_chunks > 0 else '✅'}"
    )

    # 5. 回调错误
    if errors:
        print(f"  ⚠️  回调异常({len(errors)}次): {errors[0]}")
    else:
        print(f"  ✅ 无回调异常")

    return silent_ratio < 0.95 and short_chunks == 0


def main():
    print("=" * 60)
    print("  虚拟声卡输入诊断工具 (RealTimeSTT 排查专用)")
    print("=" * 60)

    # Step 1: 查找设备
    device = find_device(TARGET_DEVICE_NAME)
    if not device:
        print(f"\n❌ 未找到包含 '{TARGET_DEVICE_NAME}' 的输入设备!")
        print("   请修改脚本顶部 TARGET_DEVICE_NAME 变量")
        sys.exit(1)

    print(f"\n🎯 目标设备: {device['name']}")

    # Step 2: 配置验证
    config_ok = validate_device_config(device)
    if not config_ok:
        print("\n⚠️  检测到配置不匹配，但将继续进行采集测试以评估实际可用性...")

    # Step 3: 采集测试
    capture_ok = test_capture(
        device_index=device["index"],
        sample_rate=TARGET_SAMPLE_RATE,
        channels=TARGET_CHANNELS,
        duration=TEST_DURATION,
    )

    # 总结
    print("\n" + "=" * 60)
    if capture_ok:
        print("✅ 虚拟声卡输出正常")
        if not config_ok:
            print("💡 提示: 存在部分配置不匹配的现象，如果实际使用出现问题，请重点关注")
    else:
        print("❌ 采集数据异常，请检查错误日志")
    print("=" * 60)


if __name__ == "__main__":
    main()
