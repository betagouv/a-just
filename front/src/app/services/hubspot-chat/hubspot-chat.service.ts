import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HubspotChatService {

  private isScriptLoaded = false;

  constructor() {}

  loadHubSpotChat() {
    if (!this.isScriptLoaded) {
      const script = document.createElement('script');
      script.type = "text/javascript"
      script.id = "hs-script-loader"
      script.async = true;
      script.defer = true;
      script.src = `//js.hs-scripts.com/${environment.hubspotAccoundId}.js`;

      document.body.appendChild(script);
      this.isScriptLoaded = true;
      
    }
  }
}