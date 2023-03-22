import { Optional } from "sequelize";
import { Column, CreatedAt, DataType, Model, Table, UpdatedAt } from "sequelize-typescript";

export type LevelAttributes = {
  id: number;
  name: string;
  subject: string;
  status: number;
  rules?: any;
  asset?: any;
  createdAt: Date;
  updatedAt: Date;
};

type LevelCreationAttributes = Optional<LevelAttributes, "id" | "createdAt" | "updatedAt">;

@Table({ tableName: "levels", schema: "content" })
export class Level extends Model<LevelAttributes, LevelCreationAttributes> {
  id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  status: number;

  @Column(DataType.JSONB)
  rules?: any;

  @Column(DataType.JSONB)
  asset?: any;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}