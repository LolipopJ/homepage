import torch


def test_cuda_training():
    print(f"PyTorch Version: {torch.__version__}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    print(f"CUDA Version: {torch.version.cuda}")
    print(f"GPU Count: {torch.cuda.device_count()}")
    print(f"Current Device: {torch.cuda.get_device_name(0)}")

    if not torch.cuda.is_available():
        return

    print("/n🚀 开始 CUDA 训练循环测试...")
    device = torch.device("cuda")
    model = torch.nn.Sequential(
        torch.nn.Linear(100, 50), torch.nn.ReLU(), torch.nn.Linear(50, 1)
    ).to(device)

    input_data = torch.randn(64, 100).to(device)
    target = torch.randn(64, 1).to(device)

    optimizer = torch.optim.SGD(model.parameters(), lr=0.01)
    criterion = torch.nn.MSELoss()

    for epoch in range(3):
        optimizer.zero_grad()
        output = model(input_data)
        loss = criterion(output, target)
        loss.backward()  # 测试反向传播是否能正常调用GPU
        optimizer.step()
        print(f"Epoch {epoch + 1}, Loss: {loss.item():.6f}")

    print("/n🎉 CUDA 完整训练循环测试通过！您的环境已完全就绪。")


test_cuda_training()
