import Phaser from "phaser";

export default class PenaltyScene extends Phaser.Scene {
  constructor() {
    super("PenaltyScene");

    this.playerChoice = null;
    this.countdown = 3;
    this.roundTimer = null;

    // 아이템 효과 플래그
    this.predictedComputerChoice = null;
    this.isTieAsWinActive = false;
  }

  init(data) {
    this.returnData = data;
    // init에서 상태를 초기화해야 씬이 재시작될 때마다 초기화됩니다.
    this.predictedComputerChoice = null;
    this.isTieAsWinActive = false;
  }

  create() {
    const { width, height } = this.scale;

    // --- UI 텍스트 ---
    this.add
      .text(
        width / 2,
        height * 0.1,
        "이겨야 탈출할 수 있는\n 가위 바위 보의 방",
        {
          fontSize: "32px",
          color: "#ff4444",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5);
    this.predictionText = this.add
      .text(width / 2, height * 0.2, "", { fontSize: "20px", color: "#00ffff" })
      .setOrigin(0.5);
    this.countdownText = this.add
      .text(width / 2, height * 0.35, "", { fontSize: "72px", color: "#fff" })
      .setOrigin(0.5);
    this.computerChoiceText = this.add
      .text(width / 2, height * 0.5, "", { fontSize: "24px", color: "#fff" })
      .setOrigin(0.5);
    this.resultText = this.add
      .text(width / 2, height * 0.6, "3초 안에 선택하세요!", {
        fontSize: "28px",
        color: "#FFD700",
      })
      .setOrigin(0.5);

    // --- 플레이어 선택 버튼 ---
    const choices = ["가위", "바위", "보"];
    this.buttons = [];
    let buttonX = 70;
    choices.forEach((choice, index) => {
      // 버튼 간격 조정
      const button = this.add
        .text(buttonX, height * 0.75, choice, {
          fontSize: "32px",
          color: "#fff",
          backgroundColor: "#555",
          padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive();
      button.on("pointerdown", () => {
        if (
          this.roundTimer &&
          !this.roundTimer.paused &&
          this.playerChoice === null
        ) {
          this.playerChoice = choice;
          this.buttons.forEach((btn) => btn.setAlpha(0.5));
          button.setAlpha(1).setScale(1.1);
          this.buttons.forEach((btn) => btn.disableInteractive());
        }
      });
      this.buttons.push(button);
      buttonX += 120;
    });

    // --- 아이템 사용 버튼 ---
    this.timeMachineButton = this.add
      .text(
        width * 0.28,
        height * 0.9,
        `미래보기 (${this.returnData.gameData.items.timeMachine})`,
        {
          fontSize: "18px",
          color: "#fff",
          backgroundColor: "#9c27b0",
          padding: { x: 10, y: 5 },
        }
      )
      .setOrigin(0.5)
      .setInteractive();
    this.tieAsWinButton = this.add
      .text(
        width * 0.72,
        height * 0.9,
        `무승부=승리 (${this.returnData.gameData.items.tieAsWin})`,
        {
          fontSize: "18px",
          color: "#fff",
          backgroundColor: "#4caf50",
          padding: { x: 10, y: 5 },
        }
      )
      .setOrigin(0.5)
      .setInteractive();

    this.timeMachineButton.on("pointerdown", this.useTimeMachine, this);
    this.tieAsWinButton.on("pointerdown", this.useTieAsWin, this);

    // 라운드 시작
    this.startRound();
  }

  useTimeMachine() {
    if (
      this.returnData.gameData.items.timeMachine > 0 &&
      this.predictedComputerChoice === null
    ) {
      this.returnData.gameData.items.timeMachine--;
      this.predictedComputerChoice = Phaser.Math.RND.pick([
        "가위",
        "바위",
        "보",
      ]);
      this.predictionText.setText(
        `타임 머신 가동!\n컴퓨터는 [${this.predictedComputerChoice}]를 낼 예정입니다.`
      );
      this.timeMachineButton
        .setText("효과 적용됨")
        .disableInteractive()
        .setAlpha(0.5);
      this.updateItemButtonText();
    }
  }

  useTieAsWin() {
    if (this.returnData.gameData.items.tieAsWin > 0 && !this.isTieAsWinActive) {
      this.returnData.gameData.items.tieAsWin--;
      this.isTieAsWinActive = true;
      this.tieAsWinButton
        .setText("효과 적용됨")
        .disableInteractive()
        .setAlpha(0.5);
      this.updateItemButtonText();
    }
  }

  updateItemButtonText() {
    this.timeMachineButton.setText(
      `미래보기 (${this.returnData.gameData.items.timeMachine})`
    );
    this.tieAsWinButton.setText(
      `무승부=승리 (${this.returnData.gameData.items.tieAsWin})`
    );
  }

  startRound() {
    this.playerChoice = null;
    this.countdown = 3;

    this.buttons.forEach((button) =>
      button.setInteractive().setAlpha(1).setScale(1)
    );
    this.countdownText.setText(this.countdown);
    this.computerChoiceText.setText("");
    this.resultText.setText("3초 안에 선택하세요!").setColor("#FFD700");

    this.roundTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.countdown--;
        this.countdownText.setText(
          this.countdown > 0 ? this.countdown : "결과!"
        );
        if (this.countdown <= 0) {
          this.roundTimer.remove();
          this.resolveRound();
        }
      },
      callbackScope: this,
      loop: true,
    });
  }

  resolveRound() {
    this.buttons.forEach((button) => button.disableInteractive().setAlpha(0.5));

    if (this.playerChoice === null) {
      this.computerChoiceText.setText("아무것도 내지 않았습니다.");
      this.resultText.setText("시간 초과! 패배...").setColor("#ff4444");
      this.time.delayedCall(2000, () => this.startRound());
      return;
    }

    const computerChoice =
      this.predictedComputerChoice ||
      Phaser.Math.RND.pick(["가위", "바위", "보"]);
    this.computerChoiceText
      .setText(`컴퓨터: ${computerChoice}\nvs\n플레이어: ${this.playerChoice}`)
      .setStyle({ fontSize: "24px", color: "#fff", textAlign: "center" });

    if (
      (this.playerChoice === computerChoice && this.isTieAsWinActive) ||
      (this.playerChoice === "바위" && computerChoice === "가위") ||
      (this.playerChoice === "가위" && computerChoice === "보") ||
      (this.playerChoice === "보" && computerChoice === "바위")
    ) {
      this.resultText.setText("승리! 탈출합니다.");
      this.resultText.setColor("#00ff00");
      this.time.delayedCall(2000, () => this.returnToGame());
    } else if (this.playerChoice === computerChoice) {
      this.resultText.setText("무승부! 다시 선택하세요.");
      this.time.delayedCall(2000, () => this.startRound());
    } else {
      this.resultText.setText("패배... 다시 도전하세요!");
      this.resultText.setColor("#ff4444");
      this.time.delayedCall(2000, () => this.startRound());
    }
  }

  returnToGame() {
    this.scene.start("GameScene", this.returnData);
  }
}
