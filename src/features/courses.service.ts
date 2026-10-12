import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseProgress } from '../database/entities/course-progress.entity.js';

export interface CourseLesson {
  day: number;
  title: string;
  scripture: string;
  teaching: string;
  reflectionQuestion: string;
  practicalAction: string;
}

export interface CourseDefinition {
  id: string;
  title: string;
  durationDays: number;
  description: string;
  lessons: Record<number, CourseLesson>;
}

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  private readonly courses: Record<string, CourseDefinition> = {
    journey_7d: {
      id: 'journey_7d',
      title: '🌅 7-Day Journey: Overcoming Triggers & Building Purity',
      durationDays: 7,
      description: 'A focused 7-day journey to understand personal triggers, guard your heart, and build sustainable purity habits.',
      lessons: {
        1: {
          day: 1,
          title: 'Identifying Your Core Triggers',
          scripture: 'Proverbs 4:23 — "Above all else, guard your heart, for everything you do flows from it."',
          teaching: 'Freedom begins with self-awareness. Most slips happen when we are tired, lonely, stressed, or bored (HALT: Hungry, Angry, Lonely, Tired). By identifying what sparks unwanted thoughts, we can replace the vulnerability with truth and healthier coping mechanisms.',
          reflectionQuestion: 'What specific time of day or emotional state makes you feel most vulnerable? Write down your top 2 triggers.',
          practicalAction: 'Remove or set screen-time locks on 1 digital app or environment that frequently triggers you.',
        },
        2: {
          day: 2,
          title: 'The Power of Renewing the Mind',
          scripture: 'Romans 12:2 — "Do not conform to the pattern of this world, but be transformed by the renewing of your mind."',
          teaching: 'Thoughts become beliefs, beliefs become actions, and actions form habits. When an impure or destructive thought enters, do not entertain it. Immediately redirect your attention to higher purpose.',
          reflectionQuestion: 'What lie have you believed about your ability to walk in total purity and wholeness?',
          practicalAction: 'Memorize or write down Romans 12:2 on a card or phone wallpaper for today.',
        },
      },
    },
    journey_21d: {
      id: 'journey_21d',
      title: '🌱 21-Day Journey: Walking in Freedom & Wholeness',
      durationDays: 21,
      description: 'A deep transformational 21-day program to rewire your neuro-pathways, heal heart wounds, and cultivate lasting victory.',
      lessons: {
        1: {
          day: 1,
          title: 'Laying the Foundation of Freedom',
          scripture: 'John 8:36 — "So if the Son sets you free, you will be free indeed."',
          teaching: 'Purity is not merely the absence of a negative behavior; it is the presence of divine life, purpose, and integrity within your heart.',
          reflectionQuestion: 'What does true freedom look like for you one year from now?',
          practicalAction: 'Take 10 minutes of quiet reflection and prayer to commit this 21-day journey.',
        },
      },
    },
  };

  constructor(
    @InjectRepository(CourseProgress)
    private readonly progressRepo: Repository<CourseProgress>,
  ) {}

  getCourses(): CourseDefinition[] {
    return Object.values(this.courses);
  }

  getCourse(courseId: string): CourseDefinition | undefined {
    return this.courses[courseId];
  }

  async getProgress(telegramId: string | number, courseId: string): Promise<CourseProgress> {
    const tid = String(telegramId);
    let progress = await this.progressRepo.findOne({
      where: { telegramId: tid, courseId },
    });

    if (!progress) {
      const course = this.getCourse(courseId);
      progress = this.progressRepo.create({
        telegramId: tid,
        courseId,
        currentDay: 1,
        totalDays: course?.durationDays ?? 7,
        completedDays: [],
        accountabilityRequested: false,
      });
      await this.progressRepo.save(progress);
    }

    return progress;
  }

  async markDayComplete(telegramId: string | number, courseId: string, day: number): Promise<CourseProgress> {
    const progress = await this.getProgress(telegramId, courseId);
    const completed = new Set(progress.completedDays ?? []);
    completed.add(day);
    progress.completedDays = Array.from(completed);

    if (progress.currentDay <= day && progress.currentDay < progress.totalDays) {
      progress.currentDay = day + 1;
    }

    return this.progressRepo.save(progress);
  }

  async requestAccountability(telegramId: string | number, courseId: string): Promise<CourseProgress> {
    const progress = await this.getProgress(telegramId, courseId);
    progress.accountabilityRequested = true;
    return this.progressRepo.save(progress);
  }

  async getAllProgress(): Promise<CourseProgress[]> {
    return this.progressRepo.find({ order: { updatedAt: 'DESC' } });
  }

  async count(): Promise<number> {
    return this.progressRepo.count();
  }
}
