import { Component, OnInit, Injector } from '@angular/core';
import { Router } from '@angular/router';

import { MemberService } from 'app/stores/member.service';
import { Member } from 'app/models/member';

// import { find } from 'lodash';

@Component({
  selector: 'members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class MembersComponent implements OnInit {
  private store: MemberService;
  private data: Member[];
  private selectedRecord: Member;
  private currentDescription;

  constructor(private router: Router, private injector: Injector) {
    this.store = this.injector.get('store.member');
  }

  ngOnInit() {
    this.store.getData()
      .then(data => this.data = data);
  }

  goToDetail(record): void {
    // let record = find(this.data, {id: id});
    this.currentDescription = record.descriptions[record.descriptions.length - 1];
    this.selectedRecord = record;
  }

  backToMembers(): void {
    this.selectedRecord = null;
  }

  isFirst(id): boolean {
    return this.selectedRecord.descriptions[0].id === id;
  }

  isLast(id): boolean {
    let descriptions = this.selectedRecord.descriptions;
    return descriptions[descriptions.length - 1].id === id;
  }

  rotate(num): void {
    let descriptions = this.selectedRecord.descriptions;
    let index = descriptions.indexOf(this.currentDescription);
    this.currentDescription = descriptions[index + num];
  }

}
