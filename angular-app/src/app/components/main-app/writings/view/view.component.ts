import { Component, OnInit } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { WritingService } from 'app/stores/writing.service';
import { Writing } from 'app/models/writing';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class ViewComponent implements OnInit {
  private text;
  private html = '<i>Choose what you want to view.</i>';
  private textView: boolean = false;
  private writings: Writing[];
  constructor(private store: WritingService, private http: Http) { }

  ngOnInit() {
    this.store.getData()
      .then(data => this.writings = data as Writing[]);
  }
  display(writing: Writing) {
    let headers = new Headers({'Content-Type': 'application/html', 'Authorization': `Bearer ${localStorage.getItem('user')}`})
    this.http.get(`assets/private/${writing.id}.${writing.mime}`, {headers: headers})
    .toPromise()
    .then(response => {
      let text = response.text();
      if (writing.mime === 'txt') {
        this.text = {
          title: writing.title,
          content: text
        }
        this.textView = true;
      } else {
        this.html = text;
        this.textView = false;
      }
    });
  }
}
