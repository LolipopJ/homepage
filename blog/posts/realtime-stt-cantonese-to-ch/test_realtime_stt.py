from RealtimeSTT import AudioToTextRecorder


def print_text(text):
    print(text)


if __name__ == "__main__":
    recorder = AudioToTextRecorder()

    while True:
        recorder.text(print_text)
