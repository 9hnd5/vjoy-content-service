import { Optional } from "sequelize";
import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from "sequelize-typescript";
import { KidLessonProgress } from "./kid-lesson-progress.entity";

type KidLearningDataAttributes = {
  kidId: number;
  gem: number;
  coin: number;
  energy: number;
  countBuyEnergy: number;
  currentLevelId?: number;
  currentUnitId?: number;
  buddyId?: number;
  buddyName?: string;
  learningGoal?: LearningGoal;
  lastUpdatedEnergy?: Date;
  lastBoughtEnergy?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type LearningGoal = {
  d?: number;
  w?: number[];
};

type KidLearningDataCreationAttributes = Optional<KidLearningDataAttributes, "kidId" | "createdAt" | "updatedAt">;

@Table({ tableName: "kid_learning_data", schema: "content", version: true })
export class KidLearningData extends Model<KidLearningDataAttributes, KidLearningDataCreationAttributes> {
  @Column({ primaryKey: true })
  kidId: number; //kidId

  @Column({ allowNull: false })
  gem: number;

  @Column({ allowNull: false })
  coin: number;

  @Column({ allowNull: false })
  energy: number;

  @Column
  countBuyEnergy: number;

  @Column
  currentLevelId?: number;

  @Column
  currentUnitId?: number;

  @Column
  buddyId?: number;

  @Column({ type: DataType.STRING(255) })
  buddyName?: string;

  @Column(DataType.JSONB)
  learningGoal?: LearningGoal;

  @Column("timestamp")
  lastUpdatedEnergy?: Date;

  @Column("timestamp")
  lastBoughtEnergy?: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => KidLessonProgress, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  kidLessonProgresses: KidLessonProgress[];
}
