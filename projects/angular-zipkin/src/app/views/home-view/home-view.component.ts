import {Component, OnInit} from '@angular/core';
import {NamesService} from '../../services/names/names.service';

@Component({
  selector: 'app-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
})
export class HomeViewComponent implements OnInit {
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
