import { Optional } from "sequelize";
import { Column, DataType, Model, Table } from "sequelize-typescript";

export type GameRuleAttributes = {
  id: number;
  levelId: number;
  unitId: number;
  type: "lesson" | "challenge";
  firstPlayReward: number;
  replayFailureReward: number;
  replaySuccessReward: number;
  energyCost: number;
};

type GameRuleCreationAttributes = Optional<GameRuleAttributes, "id">;

@Table({ tableName: "game_rules", schema: "content", timestamps: false })
export class GameRule extends Model<GameRuleAttributes, GameRuleCreationAttributes> {
  id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  levelId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  unitId: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  type: "lesson" | "challenge";

  @Column({ allowNull: false })
  firstPlayReward: number;

  @Column({ allowNull: false })
  replayFailureReward: number;

  @Column({ allowNull: false })
  replaySuccessReward: number;

  @Column({ allowNull: false })
  energyCost: number;
}
