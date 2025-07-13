// src/scenes/LeaderboardScene.js
import Phaser from "phaser";
import { getRankings } from "../helpers/FirebaseManager";

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("LeaderboardScene");
  }

  async create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, 50, "명예의 전당", {
        fontSize: "36px", // 타이틀 폰트 크기 조정
        color: "#FFD700",
      })
      .setOrigin(0.5);

    const loadingText = this.add
      .text(width / 2, height / 2, "순위를 불러오는 중...", {
        fontSize: "20px", // 로딩 텍스트 폰트 크기 조정
        color: "#fff",
      })
      .setOrigin(0.5);

    const rankings = await getRankings();
    loadingText.destroy();

    if (rankings.length === 0) {
      this.add
        .text(width / 2, height / 2, "아직 등록된 순위가 없습니다.", {
          fontSize: "20px", // 안내 텍스트 폰트 크기 조정
          color: "#fff",
        })
        .setOrigin(0.5);
    } else {
      // --- 헤더 ---
      const headerY = 120;
      const headerStyle = { fontSize: "18px", color: "#fff" };
      this.add.text(width * 0.1, headerY, "순위", headerStyle).setOrigin(0.5);
      this.add.text(width * 0.3, headerY, "이름", headerStyle).setOrigin(0.5);
      this.add.text(width * 0.55, headerY, "소속", headerStyle).setOrigin(0.5);
      this.add
        .text(width * 0.85, headerY, "기록(초)", headerStyle)
        .setOrigin(0.5);

      // --- 순위 목록 ---
      const listStyle = { fontSize: "16px", color: "#fff" };
      rankings.slice(0, 15).forEach((rank, index) => {
        // 15개까지 표시되도록 늘림
        const y = 170 + index * 35; // 간격 조정
        this.add.text(width * 0.1, y, `${index + 1}`, listStyle).setOrigin(0.5);
        this.add.text(width * 0.3, y, rank.name, listStyle).setOrigin(0.5);
        this.add.text(width * 0.55, y, rank.class, listStyle).setOrigin(0.5);
        this.add
          .text(width * 0.85, y, rank.time.toFixed(2), listStyle)
          .setOrigin(0.5);
      });
    }

    const backButton = this.add
      .text(width / 2, height - 50, "돌아가기", {
        fontSize: "24px",
        color: "#fff",
        backgroundColor: "#555",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive();
    backButton.on("pointerdown", () => this.scene.start("LandingScene"));
  }
}
