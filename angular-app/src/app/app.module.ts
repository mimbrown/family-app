import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { DropdownComponent } from './components/core/dropdown/dropdown.component';

import { AuthenticationService } from './services/authentication.service';
import { FamilyTreeService } from './services/family-tree.service';
import { MemberService } from './stores/member.service';
import { MemberLoginService } from './stores/member-login.service';
import { ChapterService } from './stores/chapter.service';
import { WritingService } from './stores/writing.service';
import { TravelService } from './stores/travel.service';
import { User } from './user.service';
import { AuthGuard } from './guards/auth.guard';
import { FamilyComponent } from 'app/components/main-app/family/family.component';
import { HistoryComponent } from 'app/components/main-app/history/history.component';
import { MembersComponent } from './components/main-app/family/members/members.component';
import { OurStoryComponent } from './components/main-app/family/our-story/our-story.component';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { LoginComponent } from './components/login/login.component';
import { MainAppComponent } from './components/main-app/main-app.component';
import { WritingsComponent } from './components/main-app/writings/writings.component';
import { ViewComponent } from './components/main-app/writings/view/view.component';
import { ComposeComponent } from './components/main-app/writings/compose/compose.component';
import { FamilyTreeComponent } from './components/main-app/family-tree/family-tree.component';

@NgModule({
  declarations: [
    AppComponent,
    DropdownComponent,
    FamilyComponent,
    HistoryComponent,
    MembersComponent,
    OurStoryComponent,
    SafeHtmlPipe,
    LoginComponent,
    MainAppComponent,
    WritingsComponent,
    ViewComponent,
    ComposeComponent,
    FamilyTreeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule
  ],
  providers: [
    AuthenticationService,
    FamilyTreeService,
    MemberService,
    {provide: 'store.member', useExisting: MemberService},
    MemberLoginService,
    ChapterService,
    {provide: 'store.chapter', useExisting: ChapterService},
    WritingService,
    TravelService,
    AuthGuard,
    User
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
