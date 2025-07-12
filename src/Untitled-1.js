// src/scenes/GameScene.js

    create() {
        // ...
        const { width, height } = this.scale;

        // ... 애니메이션, 플레이어 생성 ...
        this.player.setPosition(width / 2, height - 100); // 플레이어 시작 위치 조정

        // --- UI 텍스트 위치 재조정 ---
        this.themeText = this.add.text(width / 2, 80, '', { fontSize: '28px', /*...*/ }).setOrigin(0.5);
        this.progressText = this.add.text(width - 20, 20, '', { /*...*/ }).setOrigin(1, 0);
        this.questionText = this.add.text(width / 2, 180, '', { fontSize: '24px', wordWrap: { width: width - 40 }, /*...*/ }).setOrigin(0.5);
        this.itemText = this.add.text(20, 20, '', { fontSize: '16px', /*...*/ });
        this.totalTimerText = this.add.text(width - 20, 50, '총 시간: 00:00', { fontSize: '16px', /*...*/ }).setOrigin(1, 0);
        
        // --- 힌트 버튼 위치 조정 ---
        const hintButton = this.add.text(width / 2, height - 200, '힌트 사용', { /*...*/ }).setOrigin(0.5).setInteractive();
        // ...
    }