import { Injectable } from '@angular/core';

@Injectable()
export class User {
  token: string;
  name: string;
  profile_image: string;
  id: number;
}
