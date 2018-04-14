import { Component, OnInit } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { ChapterService } from 'app/stores/chapter.service';

import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'our-story',
  templateUrl: './our-story.component.html',
  styleUrls: ['./our-story.component.scss']
})
export class OurStoryComponent implements OnInit {
  private content;
  private chapterData;
  private _selectedChapter;
  constructor(private http: Http, private store: ChapterService) { }

  ngOnInit() {
    this.store.getData()
      .then(data => {
        this.chapterData = data;
        this.selectedChapter = data[0];
      });
  }

  onChapterSelect(value): void {
    let headers = new Headers({'Content-Type': 'application/html', 'Authorization': `Bearer ${localStorage.getItem('user')}`})
    this.http.get(`assets/public/chapters/${value.chapter_num}.html`, {headers: headers})
    .toPromise()
    .then(response => this.content = response.text());
  }

  cycle (num: number): void {
    let data = this.chapterData;
    this.selectedChapter = data[data.indexOf(this.selectedChapter) + num];
  }

  isFirst (selection): boolean {
    let data = this.chapterData;
    return data && data[0] === selection;
  }

  isLast (selection): boolean {
    let data = this.chapterData;
    return data && data[data.length - 1] === selection;
  }

  set selectedChapter (selectedChapter) {
    this._selectedChapter = selectedChapter;
    this.http.get(`assets/public/chapters/${selectedChapter.chapter_num}.html`)
    .toPromise()
    .then(response => this.content = response.text());
  }

  get selectedChapter () {
    return this._selectedChapter;
  }

}
