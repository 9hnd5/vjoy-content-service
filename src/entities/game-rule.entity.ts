import { Optional } from "sequelize";
import { Column, DataType, Model, Table } from "sequelize-typescript";

export type GameRuleAttributes = {
  id: number;
  levelId?: string;
  unitId?: string;
  type: string;
  firstPlayReward: number;
  replayFailureReward: number;
  replaySuccessReward: number;
  energyCost: number;
};

type GameRuleCreationAttributes = Optional<GameRuleAttributes, "id">;

@Table({ tableName: "game-rules", schema: "content" })
export class GameRule extends Model<GameRuleAttributes, GameRuleCreationAttributes> {
  id: number;

  @Column({ type: DataType.STRING(255) })
  levelId?: string;

  @Column({ type: DataType.STRING(255) })
  unitId?: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  type: string;

  @Column({ allowNull: false })
  firstPlayReward: number;

  @Column({ allowNull: false })
  replayFailureReward: number;

  @Column({ allowNull: false })
  replaySuccessReward: number;

  @Column({ allowNull: false })
  energyCost: number;
}
