import { Component, OnInit } from '@angular/core';

import { FamilyTreeService } from 'app/services/family-tree.service';
import { chunk }from 'lodash';
import { DatePipe } from '@angular/common';
// import { DatePipe } from '@angular/common/src/pipes/date_pipe';

let personWidth = 150;
let smallPersonWidth = 80;
let barWidth = 4;
let egoWidth = 125;

@Component({
  selector: 'app-family-tree',
  templateUrl: './family-tree.component.html',
  styleUrls: ['./family-tree.component.css'],
  providers: [DatePipe]
})
export class FamilyTreeComponent implements OnInit {
  private _id: number;
  private parents = [];
  private ego = {};
  private siblings = [];
  private spouses = [];
  private children = [];
  // private needsFill: boolean = false;
  // private noRight: boolean = false;
  private parentsWidth = '0';
  // private siblingTopWidth = '0';
  // private siblingTopMargin = '0';
  // private siblingBottomWidth = '0';
  // private siblingBottomMargin = '0';
  private siblingsWidth = '0';
  private siblingsMargin = '0';
  private spousesWidth = '0';
  private spousesMargin = '0';
  private childrenWidth = '0';
  constructor(private service: FamilyTreeService, private date: DatePipe) { }

  ngOnInit() {
    this.id = 2;
  }

  displayName (member) {
    let { nickname, first_name, last_name } = member;
    let str = nickname || first_name;
    if (last_name) {
      str += ` ${last_name}`;
    }
    return str;
  }

  displayFullName (member) {
    let { nickname, first_name, middle_name, last_name } = member;
    let str = first_name;
    if (middle_name) {
      str += ` ${middle_name}`;
    }
    if (last_name) {
      str += ` ${last_name}`;
    }
    if (nickname) {
      str += ` (${nickname})`;
    }
    return str;
  }

  displayDateRange (member) {
    let {birth_date, death_date} = member;
    let str = '';
    if (birth_date) {
      str += `${this.date.transform(new Date(birth_date), 'mediumDate')} - `;
      str += death_date ? this.date.transform(new Date(death_date), 'mediumDate') : 'Present';
    }
    return str;
  }

  set id (id) {
    this._id = id;
    this.service.getFamily(id)
    .then(response => {
      let {spouses, siblings, parents, children} = response;
      
      this.parentsWidth = (parents.length - 1)*personWidth + barWidth + 'px';
      let spousesWidth = spouses.length ? (spouses.length - 0.5)*smallPersonWidth + egoWidth : 0;
      this.spousesWidth = spousesWidth + barWidth + 'px';
      this.spousesMargin = spousesWidth + 'px';
      let siblingsWidth = siblings.length ? (siblings.length - 0.5)*smallPersonWidth + egoWidth : 0;
      this.siblingsWidth = siblingsWidth + barWidth + 'px';
      this.siblingsMargin = siblingsWidth + 'px';
      this.childrenWidth = (children.length - 1)*personWidth + barWidth + 'px';
      Object.assign(this, response);
    });
  }

  get id () {
    return this._id;
  }

}
