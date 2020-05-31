import {Component, OnInit} from '@angular/core';
import {NamesService} from "../../services/names/names.service";

@Component({
  selector: 'app-tracing-get',
  templateUrl: './tracing-get.component.html'
})
export class TracingGetComponent implements OnInit {
  public names: string[];

  constructor(private service: NamesService) {
  }

  ngOnInit(): void {
    this.service.getNames().subscribe(names => this.names = names);
  }

  public refresh(): void {
    this.service.getNames().subscribe(names => this.names = names);
  }
}
