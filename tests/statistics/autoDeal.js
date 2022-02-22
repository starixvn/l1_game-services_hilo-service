import { GameCron } from "../../src/Crons";

function runAutoDealStatistics() {
    // Arrange
    const definition = { durations: { wholeRound: 120, placingBets: 40 }, choices: ["hi", "lo"] };
    const cron = new GameCron({
        definition,
    });

    const choiceCounts = { hi: 0, lo: 0 };
    const testCount = 1000;
    const round = { result: [{ rank: 3 }] };

    // Act
    for (let i = 0; i < testCount; i++) {
        const choice = cron.autoDeal(round);
        choiceCounts[choice]++;
    }

    // Assert
    console.log(`High choice percentage: ${choiceCounts.hi / testCount}`);
    console.log(`Low choice percentage: ${choiceCounts.lo / testCount}`);
}

runAutoDealStatistics();
