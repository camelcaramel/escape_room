// src/scenes/GameClearScene.js
import Phaser from "phaser";
import { saveScore } from "../helpers/FirebaseManager";

export default class GameClearScene extends Phaser.Scene {
  constructor() {
    super("GameClearScene");
  }

  init(data) {
    this.playerInfo = data.playerInfo;
    this.gameData = data.gameData;
    console.log("GameClearScene init", this.playerInfo, this.gameData);
  }

  preload() {
    // 필요한 이미지나 리소스를 미리 불러옵니다.
    this.load.image("clearBg", "assets/images/bg_game_clear.jpg");
  }

  async create() {
    const { width, height } = this.scale;
    console.log("GameClearScene create", this.playerInfo, this.gameData);

    // 최종 클리어 시간 계산
    const completionTime =
      (this.gameData.endTime - this.gameData.startTime) / 1000;
    console.log(
      "game time",
      this.gameData.startTime,
      this.gameData.endTime,
      completionTime
    );

    // --- 배경 이미지 추가 ---
    this.add
      .image(width / 2, height / 2, "clearBg")
      .setOrigin(0.5)
      .setDepth(0);

    // --- UI 요소 ---
    this.add
      .text(
        width / 2,
        height / 2 - 150,
        `축하합니다, ${this.playerInfo.nickname}!\n\n모든 문제를\n클리어했습니다!`,
        {
          fontSize: "34px",
          color: "#00ff00",
          align: "center",
        }
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 - 50,
        `최종 기록: ${completionTime.toFixed(2)}초`,
        {
          fontSize: "28px",
          color: "#fff",
          align: "center",
        }
      )
      .setOrigin(0.5);

    const statusText = this.add
      .text(width / 2, height / 2, "순위를 저장 중입니다...", {
        fontSize: "20px",
        color: "#fff",
      })
      .setOrigin(0.5);

    // --- 점수 저장 ---
    const success = await saveScore(
      this.playerInfo.nickname,
      this.playerInfo.playerClass,
      completionTime
    );
    statusText.setText(
      success
        ? "순위가 성공적으로 저장되었습니다."
        : "순위 저장에 실패했습니다."
    );

    // --- 버튼 생성 ---
    // 순위 보기 버튼
    const rankButton = this.add
      .text(width / 2, height / 2 + 80, "순위 보기", {
        fontSize: "24px",
        color: "#fff",
        backgroundColor: "#6c757d",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive();

    rankButton.on("pointerdown", () => {
      this.scene.start("LeaderboardScene");
    });

    // 처음으로 돌아가기 버튼
    const homeButton = this.add
      .text(width / 2, height / 2 + 150, "처음으로", {
        fontSize: "24px",
        color: "#fff",
        backgroundColor: "#007BFF",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive();

    homeButton.on("pointerdown", () => {
      // 게임 데이터를 초기화하고 랜딩 씬으로 돌아갑니다.
      // 이렇게 하면 LandingScene이 새로운 게임을 시작할 수 있습니다.
      this.scene.start("LandingScene");
    });
  }
}
