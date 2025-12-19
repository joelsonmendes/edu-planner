
export interface Competency {
  id: string;
  description: string;
  knowledgeRelationship: string;
}

export interface Lesson {
  id: number;
  title: string;
  duration: string;
  objectives: string[];
  content: string;
  strategy: string;
  methodology: string;
  assessment: string;
  competenciesIds: string[];
}

export interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

export interface CourseData {
  courseName: string;
  description: string;
  targetAudience: string;
  totalDuration: string;
  competencies: Competency[];
  modules: Module[];
}
