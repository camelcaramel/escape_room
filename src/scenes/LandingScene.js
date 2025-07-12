// src/scenes/LandingScene.js
import Phaser from "phaser";

export default class LandingScene extends Phaser.Scene {
  constructor() {
    super("LandingScene");
  }

  create() {
    const { width, height } = this.scale;

    // 1. 게임 제목 (Phaser Text Object)
    // TODO: 위치 변경
    this.add
      .text(width / 2, 80, "재난 안전 방탈출", {
        fontSize: "36px",
        color: "#fff",
        fontStyle: "bold",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 3. 버튼 이벤트 리스너 추가
    const nicknameInput = document.getElementById("nickname-input");
    const classSelect = document.getElementById("class-select");
    const startButton = document.getElementById("start-button");
    const rankButton = document.getElementById("rank-button");

    const helpContainer = document.getElementById("help-container");
    const uiContainer = document.getElementById("ui-container");
    helpContainer.style.display = "block";
    uiContainer.style.display = "flex";

    startButton.addEventListener("click", () => {
      const nickname = nicknameInput.value.trim();
      const selectedClass = classSelect.value;

      if (!nickname) {
        alert("닉네임을 입력해주세요!");
        return;
      }

      // UI 숨기기
      helpContainer.style.display = "none";
      uiContainer.style.display = "none";

      // 플레이어 정보를 다음 씬으로 전달하며 게임 시작
      this.scene.start("GameScene", {
        playerInfo: {
          nickname: nickname,
          playerClass: selectedClass,
        },
        // gameData는 여기서 전달하지 않습니다. GameScene이 처음 생성합니다.
      });
    });

    rankButton.addEventListener("click", () => {
      helpContainer.style.display = "none";
      uiContainer.style.display = "none";
      this.scene.start("LeaderboardScene");
    });
  }
}
