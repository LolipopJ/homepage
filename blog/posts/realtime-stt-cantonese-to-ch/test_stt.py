from RealtimeSTT import AudioToTextRecorder

if __name__ == "__main__":
    with AudioToTextRecorder(model="tiny", device="cpu") as recorder:
        print("Speak now")
        print(recorder.text())
