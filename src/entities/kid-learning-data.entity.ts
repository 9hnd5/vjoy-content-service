import { Optional } from "sequelize";
import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { KidLessonProgress } from "./kid-lesson-progress.entity";

type KidLearningDataAttributes = {
  kidId: number;
  gem: number;
  coin: number;
  energy: number;
  countBuyEnergy: number;
  currentLevelId?: string;
  currentUnitId?: string;
  buddyId?: string;
  learningGoal?: LearningGoal;
  lastUpdatedEnergy?: Date;
  lastBoughtEnergy?: Date;
};

export type LearningGoal = {
  d?: number;
  w?: number[];
};

type KidLearningDataCreationAttributes = Optional<
  KidLearningDataAttributes,
  "kidId" | "gem" | "coin" | "energy" | "countBuyEnergy"
>;

@Table({ tableName: "kid_learning_data", schema: "content", version: true, timestamps: false })
export class KidLearningData extends Model<KidLearningDataAttributes, KidLearningDataCreationAttributes> {
  @Column({ primaryKey: true })
  kidId: number; //kidId

  @Column({ allowNull: false, defaultValue: 0 })
  gem: number;

  @Column({ allowNull: false, defaultValue: 0 })
  coin: number;

  @Column({ allowNull: false, defaultValue: 0 })
  energy: number;

  @Column({ allowNull: false, defaultValue: 0 })
  countBuyEnergy: number;

  @Column
  currentLevelId?: string;

  @Column
  currentUnitId?: string;

  @Column({ type: DataType.STRING(255) })
  buddyId?: string;

  @Column(DataType.JSONB)
  learningGoal?: LearningGoal;

  @Column("timestamp")
  lastUpdatedEnergy?: Date;

  @Column("timestamp")
  lastBoughtEnergy?: Date;

  @HasMany(() => KidLessonProgress, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  kidLessonProgresses: KidLessonProgress[];
}
