import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NamesService {

  constructor(private httpClient: HttpClient) {
  }

  public getNames(): Observable<string[]> {
    return this.httpClient.get<string[]>('/api/names');
  }
}
