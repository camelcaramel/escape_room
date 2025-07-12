// src/scenes/GameScene.js
import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.dpadState = { up: false, down: false, left: false, right: false };
  }

  init(data) {
    this.portalCollisionHandled = false;
    // 기존 플레이어 정보와 게임 데이터 초기화
    this.playerInfo = data.playerInfo;

    this.gameData = data.gameData || {
      currentQuestionIndex: 0,
      correctStreak: 0,
      items: {
        hint: 0, // 테스트를 위해 아이템 1개씩 지급
        timeMachine: 0,
        tieAsWin: 0,
      },
      startTime: this.time.now,
      endTime: 0, //  게임 종료 시간
    };
    console.log("GameScene init", this.gameData, this.time.now);
  }

  preload() {
    this.load.json("quizData", "assets/data/quizData.json");
    // 'player' 이미지를 'spritesheet'로 변경하여 로드
    this.load.spritesheet("player", "assets/images/player_sheet.png", {
      frameWidth: 48, // 각 프레임의 가로 크기
      frameHeight: 48, // 각 프레임의 세로 크기
    });
    this.load.image("portal", "assets/images/portal.png");
    this.load.image("dpad_arrow", "assets/images/dpad_arrow.png");

    // --- 사운드 파일 로드 ---
    this.load.audio("correct", "assets/sounds/correct.wav");
    this.load.audio("incorrect", "assets/sounds/incorrect.wav");

    // --- 뽑기 카드 이미지 로드 ---
    this.load.image("card", "assets/images/card.png");
  }

  create() {
    this.quizData = this.cache.json.get("quizData");
    const { width, height } = this.scale;

    // --- 애니메이션 생성 ---
    this.createPlayerAnimations();

    // --- 플레이어 생성 ---
    this.player = this.physics.add
      .sprite(width / 2, height - 50, "player")
      .setScale(1.2);
    this.player.setPosition(width / 2, height - 100); // 플레이어 초기 위치 설정
    //TODO:플레이어 초기 위치 및 크기 조정
    this.player.setCollideWorldBounds(true).setScale(3).setDepth(10); // 캐릭터 크기 약간 키움

    // --- UI 생성 (이전과 동일) ---
    this.themeText = this.add
      .text(width / 2, 180, "", { fontSize: "28px", color: "#fff" })
      .setOrigin(0.5);
    this.progressText = this.add
      .text(width - 20, 20, "", { fontSize: "20px", color: "#fff" })
      .setOrigin(1, 0);
    this.totalTimerText = this.add
      .text(width - 20, 50, "총 시간: 00:00", {
        fontSize: "16px",
        color: "#fff",
      })
      .setOrigin(1, 0);
    this.time.addEvent({
      delay: 100, // 0.1초마다 업데이트하여 부드럽게 표시
      callback: this.updateTotalTimer,
      callbackScope: this,
      loop: true,
    });

    this.questionText = this.add
      .text(width / 2, 250, "", {
        fontSize: "24px",
        color: "#fff",
        align: "center",
        wordWrap: { width: width - 40 },
      })
      .setOrigin(0.5);

    this.portals = this.physics.add.group();
    this.physics.add.overlap(
      this.player,
      this.portals,
      this.handlePortalCollision,
      null,
      this
    );

    // --- 가상 D-패드 생성 ---
    // this.createDPad();

    this.itemText = this.add.text(20, 20, "", {
      fontSize: "16px",
      color: "#fff",
    });

    this.updateItemUI();

    // --- 힌트 사용 버튼 추가 ---
    const hintButton = this.add
      .text(20, 100, "힌트 사용", {
        fontSize: "20px",
        color: "#fff",
        backgroundColor: "#ff9800",
        padding: { x: 10, y: 5 },
      })
      // .setOrigin(0.5, -2.0)
      .setInteractive();

    hintButton.on("pointerdown", () => {
      this.useHint();
    });
    this.updateItemUI(); // UI 초기 업데이트

    this.displayQuestion();
  }

  updateItemUI() {
    const { hint, timeMachine, tieAsWin } = this.gameData.items;
    this.itemText.setText(
      `[ 아이템 ]\n힌트: ${hint}개\n미래보기: ${timeMachine}개\n무승부=승리: ${tieAsWin}개`
    );
  }

  useHint() {
    const questionData = this.quizData[this.gameData.currentQuestionIndex];

    // 힌트 아이템이 없거나, 문제가 4지선다가 아니거나, 이미 힌트를 사용했을 경우 무시
    if (
      this.gameData.items.hint <= 0 ||
      questionData.choices.length !== 4 ||
      this.hintUsedOnCurrentQuestion
    ) {
      return;
    }

    this.gameData.items.hint--; // 아이템 소모
    this.updateItemUI();
    this.hintUsedOnCurrentQuestion = true; // 현재 문제에 힌트 사용했다고 표시

    // 오답 포털 목록 찾기
    const incorrectPortals = [];
    this.portals.getChildren().forEach((portal) => {
      if (!portal.getData("isCorrect")) {
        incorrectPortals.push(portal);
      }
    });

    // 제거할 오답 포털 하나를 무작위로 선택
    const portalToRemove = Phaser.Math.RND.pick(incorrectPortals);

    // 해당 포털과 연결된 텍스트를 찾아서 함께 비활성화
    this.portals.getChildren().forEach((portal, index) => {
      if (portal === portalToRemove) {
        // 포털을 비활성화하고 시각적으로 어둡게 처리
        portal.disableInteractive();
        portal.setTint(0x555555); // 회색으로 틴트

        // 연결된 선택지 텍스트도 어둡게 처리
        this.choiceTexts[index].setTint(0x555555);
      }
    });
  }

  update() {}

  startCardSelection() {
    this.gameData.correctStreak = 0;

    const overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setOrigin(0);
    const gachaText = this.add
      .text(this.scale.width / 2, 150, "3연속 정답! 카드를 선택하세요.", {
        fontSize: "32px",
        color: "#FFD700",
      })
      .setOrigin(0.5);

    // --- 보상 설정 로직 변경 ---
    // 1. 실제 아이템 목록에서 하나를 무작위로 고릅니다.
    const availableItems = ["hint", "timeMachine", "tieAsWin"];
    const winningItem = Phaser.Math.RND.pick(availableItems);

    // 2. 보상 풀을 만듭니다 (아이템 1개, 꽝 2개).
    const rewards = [winningItem, "dud", "dud"];

    // 3. 보상 풀을 무작위로 섞습니다.
    const shuffledRewards = Phaser.Math.RND.shuffle(rewards);
    // --- 여기까지 ---

    const cards = [];
    const cardSpacing = 200;
    const startX = this.scale.width / 2 - cardSpacing;

    for (let i = 0; i < 3; i++) {
      const card = this.add
        .sprite(startX + i * cardSpacing, this.scale.height / 2, "card")
        .setScale(0.1)
        .setInteractive();
      // 섞인 보상을 각 카드에 'outcome'이라는 데이터로 저장합니다.
      card.setData("outcome", shuffledRewards[i]);
      cards.push(card);

      card.on("pointerdown", () => {
        cards.forEach((c) => c.disableInteractive());
        // 이제 revealCard는 어떤 카드를 선택했는지만 알면 됩니다.
        this.revealCard(card);
      });
    }

    this.gachaGroup = this.add.group([overlay, gachaText, ...cards]);
  }

  createPlayerAnimations() {
    // 아래로 걷기
    this.anims.create({
      key: "walk-down",
      frames: this.anims.generateFrameNumbers("player", { start: 18, end: 23 }),
      frameRate: 8,
      repeat: -1,
    });
    // 오른쪽으로 걷기
    this.anims.create({
      key: "walk-right",
      frames: this.anims.generateFrameNumbers("player", { start: 24, end: 29 }),
      frameRate: 8,
      repeat: -1,
    });
    // 위로 걷기
    this.anims.create({
      key: "walk-up",
      frames: this.anims.generateFrameNumbers("player", { start: 30, end: 35 }),
      frameRate: 8,
      repeat: -1,
    });
    // 정지 상태
    this.anims.create({
      key: "idle",
      frames: [{ key: "player", frame: 0 }], // 첫 번째 프레임으로 정지
      frameRate: 20,
    });
  }

  createDPad() {
    const { width, height } = this.scale;
    const dpadSize = 60;
    const dpadMargin = 20;
    const dpadX = dpadSize + dpadMargin;
    const dpadY = height - dpadSize - dpadMargin;
    const up = this.add
      .image(dpadX, dpadY - dpadSize, "dpad_arrow")
      .setAngle(-90)
      .setInteractive();
    const down = this.add
      .image(dpadX, dpadY + dpadSize, "dpad_arrow")
      .setAngle(90)
      .setInteractive();
    const left = this.add
      .image(dpadX - dpadSize, dpadY, "dpad_arrow")
      .setAngle(180)
      .setInteractive();
    const right = this.add
      .image(dpadX + dpadSize, dpadY, "dpad_arrow")
      .setAngle(0)
      .setInteractive();
    // D-패드 버튼들이 다른 UI에 가려지지 않도록 Depth 설정 및 투명도 조절
    [up, down, left, right].forEach(
      (arrow) => arrow.setDepth(10).setAlpha(0.7).setScale(0.3)
      //TODO: D-패드 버튼 크기 조정
    );
    this.setupDPadButton(up, "up");
    this.setupDPadButton(down, "down");
    this.setupDPadButton(left, "left");
    this.setupDPadButton(right, "right");
  }

  setupDPadButton(button, direction) {
    button.on("pointerdown", () => {
      this.dpadState[direction] = true;
    });
    button.on("pointerup", () => {
      this.dpadState[direction] = false;
    });
    button.on("pointerout", () => {
      // 터치 영역을 벗어났을 때도 상태 해제
      this.dpadState[direction] = false;
    });
  }

  displayQuestion() {
    // 힌트 사용 여부 및 플레이어 위치/방향 초기화
    this.hintUsedOnCurrentQuestion = false;
    this.player.setPosition(this.scale.width / 2, this.scale.height - 100);
    this.player.setFlipX(false);

    // 현재 문제 데이터 가져오기
    const questionData = this.quizData[this.gameData.currentQuestionIndex];

    // 모든 문제를 풀었을 경우 GameClearScene으로 이동
    if (!questionData) {
      console.log("모든 문제를 클리어했습니다!");
      this.scene.start("GameClearScene", {
        playerInfo: this.playerInfo,
        gameData: this.gameData,
      });
      return;
    }

    // 상단 UI 텍스트 업데이트
    this.themeText.setText(questionData.theme);
    this.questionText.setText(questionData.question);
    this.progressText.setText(
      `${this.gameData.currentQuestionIndex + 1} / ${this.quizData.length}`
    );

    // 기존 포털 및 텍스트 오브젝트 정리
    this.portals.clear(true, true);
    if (this.choiceTexts) {
      this.choiceTexts.forEach((text) => text.destroy());
    }
    this.choiceTexts = [];

    // 포털 배치 로직
    const choices = questionData.choices;
    const { width, height } = this.scale;
    let positions = [];

    if (choices.length === 4) {
      // 4지선다: 2x2 그리드 배치
      positions = [
        { x: width * 0.3, y: height * 0.45 },
        { x: width * 0.7, y: height * 0.45 },
        { x: width * 0.3, y: height * 0.65 },
        { x: width * 0.7, y: height * 0.65 },
      ];
    } else {
      // OX 퀴즈 등 2개 선택지: 수직 배치
      positions = [
        { x: width / 2, y: height * 0.45 },
        { x: width / 2, y: height * 0.65 },
      ];
    }

    // positions 배열에 따라 포털과 텍스트 생성
    positions.forEach((pos, index) => {
      const portal = this.portals.create(pos.x, pos.y, "portal").setScale(0.3);
      portal.setData("isCorrect", index === questionData.answer);
      portal.body.setImmovable(true);
      portal.setInteractive();

      portal.on("pointerdown", () => {
        if (this.isPlayerMoving) return;
        this.moveToPortal(portal);
      });

      // 포털 아래에 선택지 텍스트 표시
      const choiceText = this.add
        .text(pos.x, pos.y + 60, choices[index], {
          fontSize: "18px",
          color: "#fff",
          align: "center",
          wordWrap: { width: 120 }, // 텍스트가 길 경우 줄바꿈
        })
        .setOrigin(0.5);
      this.choiceTexts.push(choiceText);
    });
  }

  revealCard(selectedCard) {
    const itemKoreanNames = {
      hint: "힌트",
      timeMachine: "타임 머신",
      tieAsWin: "무승부도 승리",
    };
    const cardWidth = selectedCard.displayWidth;
    const cardHeight = selectedCard.displayHeight;
    let rewardText = null;

    // 모든 카드를 순회하며 결과를 공개
    this.gachaGroup.getChildren().forEach((child) => {
      if (child.texture && child.texture.key === "card") {
        const outcome = child.getData("outcome");
        const isDud = outcome === "dud";

        // 절차적 카드 배경 생성
        const cardBG = this.add.graphics();
        cardBG.fillStyle(isDud ? 0x666666 : 0x888888, 1); // 꽝은 어둡게, 아이템은 밝게
        cardBG.fillRoundedRect(
          child.x - cardWidth / 2,
          child.y - cardHeight / 2,
          cardWidth,
          cardHeight,
          16
        );
        this.gachaGroup.add(cardBG);

        // 결과 텍스트 생성
        const resultText = isDud ? "꽝" : itemKoreanNames[outcome];
        const resultColor = isDud ? "#ff4444" : "#FFD700";
        const resultDisplay = this.add
          .text(child.x, child.y, resultText, {
            fontSize: isDud ? "48px" : "32px",
            color: resultColor,
            fontStyle: "bold",
          })
          .setOrigin(0.5);
        this.gachaGroup.add(resultDisplay);

        // 원래 카드 이미지는 숨김 처리
        child.setVisible(false);
      }
    });

    // 선택한 카드의 결과에 따라 보상 처리
    const selectedOutcome = selectedCard.getData("outcome");
    if (selectedOutcome !== "dud") {
      // 아이템 획득!
      this.gameData.items[selectedOutcome]++;
      this.updateItemUI();
      const itemNameKR = itemKoreanNames[selectedOutcome];
      rewardText = this.add
        .text(
          this.scale.width / 2,
          this.scale.height - 100,
          `${itemNameKR} 아이템 1개 획득!`,
          {
            fontSize: "28px",
            color: "#00ff00",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);
    } else {
      // 꽝!
      rewardText = this.add
        .text(
          this.scale.width / 2,
          this.scale.height - 100,
          `아쉽지만... 꽝입니다!`,
          {
            fontSize: "28px",
            color: "#ffdddd",
            fontStyle: "bold",
          }
        )
        .setOrigin(0.5);
    }
    this.gachaGroup.add(rewardText);

    // 2초 후 모든 뽑기 관련 UI를 지우고 다음 문제로 진행
    this.time.delayedCall(2000, () => {
      this.gachaGroup.clear(true, true);
      this.displayQuestion();
    });
  }
  moveToPortal(portal) {
    this.isPlayerMoving = true; // 플레이어 상태를 '이동 중'으로 변경
    const isCorrect = portal.getData("isCorrect");

    // 이동 방향에 맞춰 애니메이션과 Flip 설정
    if (this.player.x < portal.x) {
      this.player.setFlipX(false); // 오른쪽으로 이동
    } else {
      this.player.setFlipX(true); // 왼쪽으로 이동
    }
    this.player.anims.play("walk-right", true);

    // Phaser의 Tween 기능을 사용해 자동 이동 애니메이션 생성
    this.tweens.add({
      targets: this.player,
      x: portal.x,
      y: portal.y,
      duration: 800, // 0.8초 동안 이동
      ease: "Power2",

      onComplete: () => {
        this.player.anims.play("idle");
        this.isPlayerMoving = false;
        this.player.setPosition(this.scale.width / 2, this.scale.height - 50);
        this.player.setFlipX(false);
        if (isCorrect) {
          this.sound.play("correct");
          console.log("정답!");
          this.gameData.correctStreak++; // 연속 정답 횟수 증가
          this.gameData.currentQuestionIndex++;

          this.cameras.main.flash(500, 0, 255, 0);
          if (this.gameData.correctStreak >= 3) {
            this.startCardSelection(); // <-- 호출 함수 변경
          } else {
            this.time.delayedCall(500, () => this.displayQuestion());
          }
          if (this.gameData.currentQuestionIndex >= this.quizData.length) {
            // 모든 문제를 클리어했을 경우
            console.log("모든 문제를 클리어했습니다!");
            this.gameData.endTime = this.time.now; // 게임 종료 시간 기록
            // GameClearScene으로 이동할 때, 현재 playerInfo와 gameData를 전달
            this.scene.start("GameClearScene", {
              playerInfo: this.playerInfo,
              gameData: this.gameData,
            });
            return;
          }
        } else {
          this.sound.play("incorrect");
          console.log("오답! 패널티 방으로 이동합니다.");
          this.gameData.correctStreak = 0;

          this.cameras.main.shake(500, 0.02);
          this.time.delayedCall(500, () => {
            // --- 수정된 부분 ---
            this.scene.start("PenaltyScene", {
              playerInfo: this.playerInfo,
              gameData: this.gameData, // gameData 객체를 그대로 전달
              theme: this.quizData[this.gameData.currentQuestionIndex].theme,
            });
          });
        }
      },
    });
  }

  handlePortalCollision(player, portal) {
    // if (this.portalCollisionHandled) {
    //   return; // 이미 처리되었다면 아무것도 하지 않고 함수를 종료합니다.
    // }
    // // 플래그를 true로 설정하여 중복 실행을 방지합니다.
    // this.portalCollisionHandled = true;
    // // (이전 코드와 동일)
    // player.setVelocity(0);
    // this.player.anims.play("idle"); // 포털 진입 시 정지 애니메이션
    // this.portals.children.each((p) => (p.body.enable = false));
    // if (portal.getData("isCorrect")) {
    //   console.log("정답!");
    //   this.gameData.currentQuestionIndex++;
    //   this.cameras.main.flash(500, 0, 255, 0);
    //   this.time.delayedCall(500, () => this.displayQuestion());
    // } else {
    //   console.log("오답! 패널티 방으로 이동합니다.");
    //   this.cameras.main.shake(500, 0.02);
    //   this.time.delayedCall(500, () => {
    //     // 현재 상태를 가지고 패널티 씬으로 이동
    //     this.scene.start("PenaltyScene", {
    //       ...this.playerInfo,
    //       returnScene: "GameScene",
    //       gameData: this.gameData, // gameData 객체를 그대로 전달
    //       currentQuestionIndex: this.gameData.currentQuestionIndex,
    //       theme: this.quizData[this.gameData.currentQuestionIndex].theme, // <-- 이 줄을 추가합니다.
    //     });
    //   });
    // }
  }

  // 초(seconds)를 MM:SS 형식의 문자열로 변환하는 함수
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const partInSeconds = Math.floor(seconds % 60);
    const minutesString = String(minutes).padStart(2, "0");
    const secondsString = String(partInSeconds).padStart(2, "0");
    return `${minutesString}:${secondsString}`;
  }

  // 매 프레임 호출될 타이머 업데이트 함수
  updateTotalTimer() {
    const elapsedTime = (this.time.now - this.gameData.startTime) / 1000;
    this.totalTimerText.setText(`총 시간: ${this.formatTime(elapsedTime)}`);
  }
}
