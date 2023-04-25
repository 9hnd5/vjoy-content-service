import { Optional } from "sequelize";
import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt } from "sequelize-typescript";
import { KidLearningData } from "./kid-learning-data.entity";

type KidLessonProgressAttributes = {
  id: number;
  learningDataId: number;
  levelId?: number;
  unitId?: number;
  currentDifficulty: number;
  lessonId: number;
  star: number;
  type: "challenge" | "lesson";
  createdAt: Date;
  updatedAt: Date;
};

type KidLessonProgressCreationAttributes = Optional<KidLessonProgressAttributes, "id" | "createdAt" | "updatedAt">;

export const KID_LESSON_PROGRESS_DIFFICULTY = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

@Table({ tableName: "kid_lesson_progress", schema: "content" })
export class KidLessonProgress extends Model<KidLessonProgressAttributes, KidLessonProgressCreationAttributes> {
  id: number;

  @ForeignKey(() => KidLearningData)
  learningDataId: number;

  @BelongsTo(() => KidLearningData, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  kidAsset: KidLearningData;

  @Column
  levelId: number;

  @Column
  unitId: number;

  @Column
  currentDifficulty: number;

  @Column({ allowNull: false })
  lessonId: number;

  @Column({ allowNull: false })
  star: number;

  @Column({ type: DataType.STRING(20), allowNull: false })
  type: "challenge" | "lesson";

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
