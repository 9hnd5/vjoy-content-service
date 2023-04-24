import { Optional } from "sequelize";
import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt } from "sequelize-typescript";
import { KidLearningData } from "./kid-learning-data.entity";

type KidLessonProgressAttributes = {
  id: number;
  kidLearningDataId: number;
  levelId?: number;
  unitId?: number;
  lessonId: number;
  star: number;
  type: "challenge" | "lesson";
  createdAt: Date;
  updatedAt: Date;
};

type KidLessonProgressCreationAttributes = Optional<KidLessonProgressAttributes, "id" | "createdAt" | "updatedAt">;

@Table({ tableName: "kid_lesson_progress", schema: "content" })
export class KidLessonProgress extends Model<KidLessonProgressAttributes, KidLessonProgressCreationAttributes> {
  id: number;

  @ForeignKey(() => KidLearningData)
  kidLearningDataId: number;

  @BelongsTo(() => KidLearningData)
  kidAsset: KidLearningData;

  @Column
  levelId: number;

  @Column
  unitId: number;

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
