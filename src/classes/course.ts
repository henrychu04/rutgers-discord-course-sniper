export default class Course {
  num: string;
  name: string = '';
  time: number = 0;

  constructor(num: string) {
    this.num = num;
  }

  setName(name: string) {
    this.name = name;
  }
}
