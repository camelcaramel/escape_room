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
        fontSize: "48px",
        color: "#FFD700",
      })
      .setOrigin(0.5);

    const loadingText = this.add
      .text(width / 2, height / 2, "순위를 불러오는 중...", {
        fontSize: "24px",
        color: "#fff",
      })
      .setOrigin(0.5);

    const rankings = await getRankings();
    loadingText.destroy();

    if (rankings.length === 0) {
      this.add
        .text(width / 2, height / 2, "아직 등록된 순위가 없습니다.", {
          fontSize: "24px",
          color: "#fff",
        })
        .setOrigin(0.5);
    } else {
      // 순위 헤더
      this.add.text(100, 120, "순위", { fontSize: "20px", color: "#fff" });
      this.add.text(250, 120, "이름", { fontSize: "20px", color: "#fff" });
      this.add.text(450, 120, "소속", { fontSize: "20px", color: "#fff" });
      this.add.text(650, 120, "기록(초)", { fontSize: "20px", color: "#fff" });

      // 순위 목록 표시 (상위 10개)
      rankings.slice(0, 10).forEach((rank, index) => {
        const y = 160 + index * 40;
        this.add.text(100, y, `${index + 1}`, {
          fontSize: "18px",
          color: "#fff",
        });
        this.add.text(250, y, rank.name, { fontSize: "18px", color: "#fff" });
        this.add.text(450, y, rank.class, { fontSize: "18px", color: "#fff" });
        this.add.text(650, y, rank.time.toFixed(2), {
          fontSize: "18px",
          color: "#fff",
        });
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
