# ================= 配置区 =================
# 是否打印更详细的日志信息，用于排查问题
EXTENDED_LOGGING = False
# 是否将结果输出以键盘的形式输出
# set to 0 to deactivate writing to keyboard
# try lower values like 0.002 (fast) first, take higher values like 0.05 in case it fails
WRITE_TO_KEYBOARD_INTERVAL = 0
# ==========================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Start the realtime Speech-to-Text (STT) test with various configuration options."
    )

    parser.add_argument(
        "-m",
        "--model",
        type=str,
        help="Path to the STT model or model size. Options include: tiny, tiny.en, base, base.en, small, small.en, medium, medium.en, large-v1, large-v2, or any huggingface CTranslate2 STT model such as deepdml/faster-whisper-large-v3-turbo-ct2. Default is large-v2.",
    )

    parser.add_argument(
        "-r",
        "--rt-model",
        "--realtime_model_type",
        type=str,
        help="Model size for real-time transcription. Options same as --model.  This is used only if real-time transcription is enabled (enable_realtime_transcription). Default is tiny.en.",
    )

    parser.add_argument(
        "-l",
        "--lang",
        "--language",
        type=str,
        help="Language code for the STT model to transcribe in a specific language. Leave this empty for auto-detection based on input audio. Default is en. List of supported language codes: https://github.com/openai/whisper/blob/main/whisper/tokenizer.py#L11-L110",
    )

    parser.add_argument(
        "--root",
        type=str,
        help="Root directory where the Whisper models are downloaded to.",
    )

    parser.add_argument(
        "-d", "--device", type=str, help="Name of the audio input device to listen to."
    )

    parser.add_argument(
        "-s",
        "--sample-rate",
        type=int,
        help="Sample rate of the audio input device. Will be resampled to 16000 if different.",
    )

    def check_and_install_packages(packages):
        """
        Checks if the specified packages are installed, and if not, prompts the user
        to install them.

        Parameters:
        - packages: A list of dictionaries, each containing:
            - 'import_name': The name used in the import statement.
            - 'install_name': (Optional) The name used in the pip install command.
                            Defaults to 'import_name' if not provided.
            - 'version': (Optional) Version constraint for the package.
        """
        import subprocess
        import sys

        for package in packages:
            import_name = package["import_name"]
            install_name = package.get("install_name", import_name)
            version = package.get("version", "")

            try:
                __import__(import_name)
            except ImportError:
                user_input = input(
                    f"This program requires the '{import_name}' library, which is not installed.\n"
                    f"Do you want to install it now? (y/n): "
                )
                if user_input.strip().lower() == "y":
                    try:
                        # Build the pip install command
                        install_command = [sys.executable, "-m", "pip", "install"]
                        if version:
                            install_command.append(f"{install_name}{version}")
                        else:
                            install_command.append(install_name)

                        subprocess.check_call(install_command)
                        __import__(import_name)
                        print(f"Successfully installed '{install_name}'.")
                    except Exception as e:
                        print(
                            f"An error occurred while installing '{install_name}': {e}"
                        )
                        sys.exit(1)
                else:
                    print(
                        f"The program requires the '{import_name}' library to run. Exiting..."
                    )
                    sys.exit(1)

    check_and_install_packages(
        [
            {
                "import_name": "rich",
            },
            {
                "import_name": "colorama",
            },
            {
                "import_name": "pyautogui",
            },
        ]
    )

    def get_device_index_by_name(device_name: str) -> int:
        """根据设备名称匹配获取 PyAudio 设备索引。
        当存在同名设备时，优先选择 channel 为 1，sample rate 为 16000 的设备。
        """
        import pyaudio

        p = pyaudio.PyAudio()
        try:
            device_count = p.get_device_count()
            matched_devices = []
            first_found_index = None

            # 1. 遍历所有设备，筛选出名称匹配且为输入设备的列表
            for i in range(device_count):
                info = p.get_device_info_by_index(i)
                if int(info["maxInputChannels"]) > 0 and info["name"] == device_name:
                    matched_devices.append((i, info))
                    if first_found_index is None:
                        first_found_index = i

            # 2. 如果未找到匹配设备，打印可用列表并抛出异常
            if not matched_devices:
                print(f"[✗] 未找到设备: '{device_name}'")
                print("可用的输入设备列表:")
                for i in range(device_count):
                    info = p.get_device_info_by_index(i)
                    if int(info["maxInputChannels"]) > 0:
                        print(
                            f"  [{i}] {info['name']} (ch={info['maxInputChannels']}, rate={int(info['defaultSampleRate'])})"
                        )
                raise ValueError(f"找不到名为 '{device_name}' 的输入设备")

            # 3. 对匹配到的同名设备进行优先级排序
            # 排序规则：优先通道数为1，其次优先采样率为16000
            matched_devices.sort(
                key=lambda x: (
                    x[1]["maxInputChannels"]
                    != 1,  # False(0) 排在 True(1) 前面，即通道为1的优先
                    abs(
                        x[1]["defaultSampleRate"] - 16000
                    ),  # 距离16000越近的值越小，越靠前
                )
            )

            # 4. 获取最优设备索引和信息
            best_index, best_info = matched_devices[0]

            # 5. 如果存在多个同名设备，且最优设备不是列表中的第一个，打印警告
            if best_index != first_found_index:
                print(
                    f"[⚠️] 警告: 发现 {len(matched_devices)} 个同名设备 '{device_name}'。"
                    f"已根据规则自动选择最优设备 index={best_index} "
                    f"(ch={best_info['maxInputChannels']}, rate={int(best_info['defaultSampleRate'])})"
                )

            return best_index

        finally:
            p.terminate()

    if EXTENDED_LOGGING:
        import logging

        logging.basicConfig(level=logging.DEBUG)

    from rich.console import Console
    from rich.live import Live
    from rich.text import Text
    from rich.panel import Panel

    console = Console()
    console.print("System initializing, please wait")

    import os
    import sys
    from RealtimeSTT import AudioToTextRecorder
    import colorama
    import pyautogui

    if os.name == "nt" and (3, 8) <= sys.version_info < (3, 99):
        from torchaudio._extension.utils import _init_dll_path

        _init_dll_path()

    colorama.init()

    # Initialize Rich Console and Live
    live = Live(console=console, refresh_per_second=10, screen=False)
    live.start()

    full_sentences = []
    rich_text_stored = ""
    recorder = None
    displayed_text = ""  # Used for tracking text that was already displayed

    end_of_sentence_detection_pause = 0.4
    unknown_sentence_detection_pause = 0.5
    mid_sentence_detection_pause = 2.0

    def clear_console():
        os.system("clear" if os.name == "posix" else "cls")

    prev_text = ""

    def preprocess_text(text):
        # Remove leading whitespaces
        text = text.lstrip()

        #  Remove starting ellipses if present
        if text.startswith("..."):
            text = text[3:]

        # Remove any leading whitespaces again after ellipses removal
        text = text.lstrip()

        # Uppercase the first letter
        if text:
            text = text[0].upper() + text[1:]

        return text

    def text_detected(text):
        global prev_text, displayed_text, rich_text_stored

        text = preprocess_text(text)

        sentence_end_marks = [".", "!", "?", "。"]
        if text.endswith("..."):
            recorder.post_speech_silence_duration = mid_sentence_detection_pause
        elif (
            text
            and text[-1] in sentence_end_marks
            and prev_text
            and prev_text[-1] in sentence_end_marks
        ):
            recorder.post_speech_silence_duration = end_of_sentence_detection_pause
        else:
            recorder.post_speech_silence_duration = unknown_sentence_detection_pause

        prev_text = text

        # Build Rich Text with alternating colors
        rich_text = Text()
        for i, sentence in enumerate(full_sentences):
            if i % 2 == 0:
                # rich_text += Text(sentence, style="bold yellow") + Text(" ")
                rich_text += Text(sentence, style="yellow") + Text(" ")
            else:
                rich_text += Text(sentence, style="cyan") + Text(" ")

        # If the current text is not a sentence-ending, display it in real-time
        if text:
            rich_text += Text(text, style="bold yellow")

        new_displayed_text = rich_text.plain

        if new_displayed_text != displayed_text:
            displayed_text = new_displayed_text
            panel = Panel(
                rich_text,
                title="[bold green]Live Transcription[/bold green]",
                border_style="bold green",
            )
            live.update(panel)
            rich_text_stored = rich_text

    def process_text(text):
        global recorder, full_sentences, prev_text
        recorder.post_speech_silence_duration = unknown_sentence_detection_pause

        text = preprocess_text(text)
        text = text.rstrip()
        if text.endswith("..."):
            text = text[:-2]

        if not text:
            return

        full_sentences.append(text)
        prev_text = ""
        text_detected("")

        if WRITE_TO_KEYBOARD_INTERVAL:
            pyautogui.write(
                f"{text} ", interval=WRITE_TO_KEYBOARD_INTERVAL
            )  # Adjust interval as needed

    # Recorder configuration
    recorder_config = {
        "spinner": False,
        "model": "deepdml/faster-whisper-large-v3-turbo-ct2",  # or large-v2 or deepdml/faster-whisper-large-v3-turbo-ct2 or ...
        "realtime_model_type": "tiny",  # or small.en or distil-small.en or ...
        "language": "zh",
        "compute_type": "float16",
        "download_root": None,  # default download root location. Ex. ~/.cache/huggingface/hub/ in Linux
        "silero_sensitivity": 0.5,
        "webrtc_sensitivity": 3,
        "post_speech_silence_duration": unknown_sentence_detection_pause,
        "min_length_of_recording": 1.1,
        "min_gap_between_recordings": 0,
        "silero_deactivity_detection": True,
        "early_transcription_on_silence": 500,
        "beam_size": 5,
        "no_log_file": True,
        "silero_use_onnx": True,
        "faster_whisper_vad_filter": True,
        "enable_realtime_transcription": True,
        "realtime_processing_pause": 0.2,
        "on_realtime_transcription_update": text_detected,
        "realtime_transcription_use_syllable_boundaries": False,
        "realtime_boundary_detector_sensitivity": 0.6,
        "realtime_boundary_followup_delays": (0.5,),
        "beam_size_realtime": 3,
        "initial_prompt_realtime": (
            "End incomplete sentences with ellipses.\n"
            "Examples:\n"
            "Complete: 天空是蓝色的.\n"
            "Incomplete: 当天空...\n"
            "Complete: 她走回家.\n"
            "Incomplete: 因为他...\n"
        ),
    }

    args = parser.parse_args()
    if args.model is not None:
        recorder_config["model"] = args.model
        print(f"Argument 'model' set to {recorder_config['model']}")
    if args.rt_model is not None:
        recorder_config["realtime_model_type"] = args.rt_model
        print(
            f"Argument 'realtime_model_type' set to {recorder_config['realtime_model_type']}"
        )
    if args.lang is not None:
        recorder_config["language"] = args.lang
        print(f"Argument 'language' set to {recorder_config['language']}")
    if args.root is not None:
        recorder_config["download_root"] = args.root
        print(f"Argument 'download_root' set to {recorder_config['download_root']}")
    if args.device is not None:
        recorder_config["input_device_index"] = get_device_index_by_name(args.device)
        print(
            f"Argument 'device' set to {args.device} (index {recorder_config['input_device_index']})"
        )
    if args.sample_rate is not None:
        recorder_config["sample_rate"] = args.sample_rate
        print(f"Argument 'sample_rate' set to {recorder_config['sample_rate']}")

    if EXTENDED_LOGGING:

        def on_chunk(chunk):
            import numpy as np

            audio_data = np.frombuffer(chunk, dtype=np.int16)
            rms = np.sqrt(np.mean(audio_data.astype(float) ** 2))
            if rms > 100:
                print(f"[AUDIO] RMS Level: {rms:.0f}")

        def on_vad_start():
            print("🔴 [VAD] Speech START detected!")

        def on_vad_stop():
            print("⚪ [VAD] Speech END detected!")

        recorder_config["level"] = logging.DEBUG
        recorder_config["use_extended_logging"] = True
        recorder_config["print_transcription_time"] = True
        recorder_config["on_recorded_chunk"] = on_chunk
        recorder_config["on_vad_start"] = on_vad_start
        recorder_config["on_vad_stop"] = on_vad_stop

    recorder = AudioToTextRecorder(**recorder_config)

    initial_text = Panel(
        Text("Say something...", style="cyan bold"),
        title="[bold yellow]Waiting for Input[/bold yellow]",
        border_style="bold yellow",
    )
    live.update(initial_text)

    try:
        while True:
            recorder.text(process_text)
    except KeyboardInterrupt:
        live.stop()
        console.print("[bold red]Transcription stopped by user. Exiting...[/bold red]")
        exit(0)
