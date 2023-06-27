import { Optional } from "sequelize";
import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt } from "sequelize-typescript";
import { KidData } from "./kid-data.entity";

type KidLessonAttributes = {
  id: number;
  kidId: number;
  levelId?: string;
  unitId?: string;
  lessonId: string;
  isGemUnlocked: boolean;
  star: number;
  type: "challenge" | "lesson";
};

type KidLessonCreationAttributes = Optional<KidLessonAttributes, "id">;

export const KID_LESSON_STAR = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

@Table({ tableName: "kid_lesson", schema: "content", timestamps: false })
export class KidLesson extends Model<KidLessonAttributes, KidLessonCreationAttributes> {
  id: number;

  @ForeignKey(() => KidData)
  kidId: number;

  @BelongsTo(() => KidData, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  kidData: KidData;

  @Column
  levelId: string;

  @Column
  unitId: string;

  @Column({ allowNull: false })
  lessonId: string;

  @Column
  isGemUnlocked: boolean;

  @Column({ allowNull: false })
  star: number;

  @Column({ type: DataType.STRING(20), allowNull: false })
  type: "challenge" | "lesson";
}
