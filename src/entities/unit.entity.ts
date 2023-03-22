import { Optional } from "sequelize";
import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import { Level } from "./level.entity";

export const UNIT_STATUS = {
  NEW: 0,
  APPROVED: 1,
  PUBLISHED: 2,
  HIDE: 3,
};

export type UnitAttributes = {
  id: number;
  name?: string;
  levelId: string;
  status: number;
  rules?: any;
  asset?: any;
  createdAt: Date;
  updatedAt: Date;
};

type UnitCreationAttributes = Optional<UnitAttributes, "id" | "status" | "createdAt" | "updatedAt">;

@Table({ tableName: "units", schema: "content" })
export class Unit extends Model<UnitAttributes, UnitCreationAttributes> {
  id: number;

  @Column(DataType.STRING(255))
  name?: string;

  @Default(UNIT_STATUS.NEW)
  @Column({ type: DataType.INTEGER, allowNull: false })
  status: number;

  @ForeignKey(() => Level)
  @Column({ type: DataType.STRING(255), allowNull: false })
  levelId: string;

  @BelongsTo(() => Level)
  level: Level;

  @Column(DataType.JSONB)
  rules?: any;

  @Column(DataType.JSONB)
  asset?: any;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
