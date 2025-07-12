import Phaser from "phaser";
import "../style.css";

// 씬(Scene)들을 import 합니다.
import LandingScene from "./scenes/LandingScene";
import GameScene from "./scenes/GameScene"; // 나중에 추가할 씬들
import PenaltyScene from "./scenes/PenaltyScene";
import GameClearScene from "./scenes/GameClearScene";
import LeaderboardScene from "./scenes/LeaderBoardScene";
const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 360,
  height: 800,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT, // 화면 비율을 유지하면서 게임 전체가 보이도록 자동으로 맞춤
    autoCenter: Phaser.Scale.CENTER_BOTH, // 가로, 세로 모두 중앙 정렬
  },
  // 여기에 사용할 씬 클래스들을 배열로 나열합니다.
  scene: [
    LandingScene,
    GameScene,
    PenaltyScene,
    GameClearScene,
    LeaderboardScene,
  ],
};

export default new Phaser.Game(config);
