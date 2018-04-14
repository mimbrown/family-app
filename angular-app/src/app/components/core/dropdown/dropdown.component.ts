import { Component, OnInit, Injector, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  inputs: [
    'store',
    'displayField',
    'valueField'
  ]
})
export class DropdownComponent implements OnInit {
  private records: any[];
  private isShown: boolean;
  private store;

  @Input() selection;
  @Output() selectionChange = new EventEmitter()

  constructor(private injector: Injector) { }

  ngOnInit() {
    this.resolveStore();
    this.store.getData()
      .then(records => {
        this.records = records;
      });
  }

  resolveStore(): void {
    this.store = this.injector.get(`store.${this.store}`);
  }

  change(newValue) {
    this.selection = newValue;
    this.selectionChange.emit(newValue);
  }

}
