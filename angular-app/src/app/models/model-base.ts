export abstract class ModelBase {
  _get(field: string): any {
    return this[field];
  }
}
