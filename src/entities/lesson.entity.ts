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
import { Unit } from "./unit.entity";

export const LESSON_STATUS = {
  NEW: 0,
  APPROVED: 1,
  PUBLISHED: 2,
  HIDE: 3,
};

export type LessonAttributes = {
  id: number;
  name?: string;
  status: number;
  unitId: number;
  rules?: any;
  asset?: any;
  gameType: string;
  createdAt: Date;
  updatedAt: Date;
};

type LessonCreationAttributes = Optional<LessonAttributes, "id" | "status" | "createdAt" | "updatedAt">;

@Table({ tableName: "lessons", schema: "content" })
export class Lesson extends Model<LessonAttributes, LessonCreationAttributes> {
  id: number;

  @Column(DataType.STRING(255))
  name?: string;

  @Default(LESSON_STATUS.NEW)
  @Column({ type: DataType.INTEGER, allowNull: false })
  status: number;

  @ForeignKey(() => Unit)
  @Column({ type: DataType.INTEGER, allowNull: false })
  unitId: number;

  @BelongsTo(() => Unit)
  unit: Unit;

  @Column(DataType.JSONB)
  rules?: any;

  @Column(DataType.JSONB)
  asset?: any;

  @Column({ type: DataType.STRING(255), allowNull: false })
  gameType: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
