import { ModelBase } from './model-base';
import { MemberDescription } from './member-description';

export class Member extends ModelBase {
    descriptions: Array<MemberDescription>;
}
