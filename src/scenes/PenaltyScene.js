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
  // preload 함수를 추가하여 페널티룸 배경을 불러옵니다.
  preload() {
    this.load.image("penaltyBg", "assets/images/bg_penalty.png");
    this.load.image("rock", "assets/images/rock.png");
    this.load.image("paper", "assets/images/paper.png");
    this.load.image("scissors", "assets/images/scissors.png");
  }

  create() {
    const { width, height } = this.scale;

    // --- 배경 이미지 추가 ---
    this.add
      .image(width / 2, height / 2, "penaltyBg")
      .setOrigin(0.5)
      .setDepth(0);

    // --- UI 텍스트 --- (기존 코드)
    // 모든 UI 요소들이 배경보다 위에 보이도록 setDepth(1)을 추가하거나,
    // 배경의 setDepth(0) 보다 높은 값을 설정합니다.
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
      .setOrigin(0.5)
      .setDepth(1);

    this.predictionText = this.add
      .text(width / 2, height * 0.2, "", { fontSize: "20px", color: "#00ffff" })
      .setOrigin(0.5);
    this.countdownText = this.add
      .text(width / 2, height * 0.35, "", { fontSize: "72px", color: "#fff" })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.5 - 50, "컴퓨터", {
        fontSize: "24px",
        color: "#fff",
      })
      .setOrigin(0.5)
      .setDepth(1);

    this.computerChoiceImage = this.add
      .image(width / 2, height * 0.5 + 30, "question_mark")
      .setScale(1.0)
      .setDepth(1);

    this.resultText = this.add
      .text(width / 2, height * 0.6, "3초 안에 선택하세요!", {
        fontSize: "28px",
        color: "#FFD700",
      })
      .setOrigin(0.5);

    // --- 플레이어 선택 버튼 ---
    const choices = [
      { name: "가위", texture: "scissors" },
      { name: "바위", texture: "rock" },
      { name: "보", texture: "paper" },
    ];
    this.buttons = [];
    const buttonY = height * 0.8;
    const buttonSpacing = width / 4;

    choices.forEach((choice, index) => {
      const buttonX = (index + 1) * buttonSpacing;

      const button = this.add
        .image(buttonX, buttonY, choice.texture)
        .setOrigin(0.5)
        .setScale(3.0)
        .setInteractive()
        .setDepth(1);

      button.on("pointerdown", () => {
        if (
          this.roundTimer &&
          !this.roundTimer.paused &&
          this.playerChoice === null
        ) {
          this.playerChoice = choice.name; // 로직 처리를 위해 이름 저장
          this.buttons.forEach((btn) => btn.setAlpha(0.5)); // 선택 안 된 것들 흐리게
          button.setAlpha(1).setScale(1.2); // 선택된 것 강조
          this.buttons.forEach((btn) => btn.disableInteractive());
        }
      });
      this.buttons.push(button);
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

    this.computerChoiceAnimation = this.time.addEvent({
      delay: 100, // 0.1초마다 이미지를 변경합니다. (속도 조절 가능)
      callback: () => {
        const textures = ["rock", "paper", "scissors"];
        const randomTexture = Phaser.Math.RND.pick(textures);
        this.computerChoiceImage.setTexture(randomTexture);
      },
      callbackScope: this,
      loop: true,
      paused: true, // 처음에는 멈춤 상태로 시작
    });
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

    // 이미지 버튼들 초기화
    this.buttons.forEach((button) =>
      button.setInteractive().setAlpha(1).setScale(1.0)
    );
    // 컴퓨터 선택 이미지를 물음표로 초기화
    this.computerChoiceImage.setTexture("question_mark");
    this.computerChoiceAnimation.paused = false;

    this.countdownText.setText(this.countdown);
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
    this.computerChoiceAnimation.paused = true;

    this.buttons.forEach((button) => button.disableInteractive().setAlpha(0.5));

    if (this.playerChoice === null) {
      // this.computerChoiceText.setText("아무것도 내지 않았습니다.");
      this.resultText.setText("시간 초과! 패배...").setColor("#ff4444");
      this.time.delayedCall(2000, () => this.startRound());
      return;
    }

    const computerChoice =
      this.predictedComputerChoice ||
      Phaser.Math.RND.pick(["가위", "바위", "보"]);

    // ▼▼▼▼▼ 컴퓨터 선택을 텍스트 대신 이미지로 보여주기 ▼▼▼▼▼
    let computerChoiceTexture;
    if (computerChoice === "가위") computerChoiceTexture = "scissors";
    if (computerChoice === "바위") computerChoiceTexture = "rock";
    if (computerChoice === "보") computerChoiceTexture = "paper";

    this.computerChoiceImage.setTexture(computerChoiceTexture);
    // this.computerChoiceText
    //   .setText(`컴퓨터: ${computerChoice}\nvs\n플레이어: ${this.playerChoice}`)
    //   .setStyle({ fontSize: "24px", color: "#fff", textAlign: "center" });

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
