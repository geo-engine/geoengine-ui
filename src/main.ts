import {bootstrap}    from 'angular2/platform/browser'
import {ExampleApp} from './example-app'
import {AppComponent} from './app.component'
import {TestComponent} from './test.component'

bootstrap(AppComponent).catch(err => console.error(err));