import { ModelBase } from './model-base';

export class MemberDescription extends ModelBase {
    id: number;
    member_id: number;
    title: string;
    description: string;
}
