'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">a-just-front documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AboutUsModule.html" data-type="entity-link" >AboutUsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AboutUsModule-efcbf95c6805f05e3a3b78cb0f3b4340892c554b7af594b382863db8c02e1cd61f7c0a5d64ca1d4bc38d6cfd6bd48a612a9c2829a899e93055916121eee55e54"' : 'data-target="#xs-components-links-module-AboutUsModule-efcbf95c6805f05e3a3b78cb0f3b4340892c554b7af594b382863db8c02e1cd61f7c0a5d64ca1d4bc38d6cfd6bd48a612a9c2829a899e93055916121eee55e54"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AboutUsModule-efcbf95c6805f05e3a3b78cb0f3b4340892c554b7af594b382863db8c02e1cd61f7c0a5d64ca1d4bc38d6cfd6bd48a612a9c2829a899e93055916121eee55e54"' :
                                            'id="xs-components-links-module-AboutUsModule-efcbf95c6805f05e3a3b78cb0f3b4340892c554b7af594b382863db8c02e1cd61f7c0a5d64ca1d4bc38d6cfd6bd48a612a9c2829a899e93055916121eee55e54"' }>
                                            <li class="link">
                                                <a href="components/AboutUsPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AboutUsPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AboutUsPageModule.html" data-type="entity-link" >AboutUsPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ActivitiesModule.html" data-type="entity-link" >ActivitiesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-ActivitiesModule-8520e0ea14fa5b56d76c765aee72b0e96fa899736b0d6622346cb7f3c4b2e7a6131981b555063b4187435bb64700f5edc9f59e0d4b4e4ea92c293cc60f07b479"' : 'data-target="#xs-components-links-module-ActivitiesModule-8520e0ea14fa5b56d76c765aee72b0e96fa899736b0d6622346cb7f3c4b2e7a6131981b555063b4187435bb64700f5edc9f59e0d4b4e4ea92c293cc60f07b479"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ActivitiesModule-8520e0ea14fa5b56d76c765aee72b0e96fa899736b0d6622346cb7f3c4b2e7a6131981b555063b4187435bb64700f5edc9f59e0d4b4e4ea92c293cc60f07b479"' :
                                            'id="xs-components-links-module-ActivitiesModule-8520e0ea14fa5b56d76c765aee72b0e96fa899736b0d6622346cb7f3c4b2e7a6131981b555063b4187435bb64700f5edc9f59e0d4b4e4ea92c293cc60f07b479"' }>
                                            <li class="link">
                                                <a href="components/ActivitiesPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ActivitiesPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ActivitiesPageModule.html" data-type="entity-link" >ActivitiesPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AppModule-94ecce45cc6bace81f2de8586a435614d9e45dd6dcf07bdbcf52364c14a181311a8c7b60639ec1a910b4024850c14c00341e66b0a339c43b1de6d9ddadf5a6dd"' : 'data-target="#xs-components-links-module-AppModule-94ecce45cc6bace81f2de8586a435614d9e45dd6dcf07bdbcf52364c14a181311a8c7b60639ec1a910b4024850c14c00341e66b0a339c43b1de6d9ddadf5a6dd"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-94ecce45cc6bace81f2de8586a435614d9e45dd6dcf07bdbcf52364c14a181311a8c7b60639ec1a910b4024850c14c00341e66b0a339c43b1de6d9ddadf5a6dd"' :
                                            'id="xs-components-links-module-AppModule-94ecce45cc6bace81f2de8586a435614d9e45dd6dcf07bdbcf52364c14a181311a8c7b60639ec1a910b4024850c14c00341e66b0a339c43b1de6d9ddadf5a6dd"' }>
                                            <li class="link">
                                                <a href="components/AlertComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AlertComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppRoutingModule.html" data-type="entity-link" >AppRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AverageEtpModule.html" data-type="entity-link" >AverageEtpModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AverageEtpModule-ec71392cae76bb47ed025cb2365026a796626c7c7d221bf5e334298573ce4149ab95ced0b6fdc230eeec8dc07899912ae36a4fe3d63927d6afa73358698d7cb1"' : 'data-target="#xs-components-links-module-AverageEtpModule-ec71392cae76bb47ed025cb2365026a796626c7c7d221bf5e334298573ce4149ab95ced0b6fdc230eeec8dc07899912ae36a4fe3d63927d6afa73358698d7cb1"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AverageEtpModule-ec71392cae76bb47ed025cb2365026a796626c7c7d221bf5e334298573ce4149ab95ced0b6fdc230eeec8dc07899912ae36a4fe3d63927d6afa73358698d7cb1"' :
                                            'id="xs-components-links-module-AverageEtpModule-ec71392cae76bb47ed025cb2365026a796626c7c7d221bf5e334298573ce4149ab95ced0b6fdc230eeec8dc07899912ae36a4fe3d63927d6afa73358698d7cb1"' }>
                                            <li class="link">
                                                <a href="components/AverageEtpPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AverageEtpPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AverageEtpPageModule.html" data-type="entity-link" >AverageEtpPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/CalculatorModule.html" data-type="entity-link" >CalculatorModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-CalculatorModule-cb39c013699b833366291bd1b9efe74fda837c7f1bd8dd3f7a56e16dde6b3cfd8386fc462a9f2cda08917f5c7173dae2e3674d030e98292b999112c5eeed5276"' : 'data-target="#xs-components-links-module-CalculatorModule-cb39c013699b833366291bd1b9efe74fda837c7f1bd8dd3f7a56e16dde6b3cfd8386fc462a9f2cda08917f5c7173dae2e3674d030e98292b999112c5eeed5276"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CalculatorModule-cb39c013699b833366291bd1b9efe74fda837c7f1bd8dd3f7a56e16dde6b3cfd8386fc462a9f2cda08917f5c7173dae2e3674d030e98292b999112c5eeed5276"' :
                                            'id="xs-components-links-module-CalculatorModule-cb39c013699b833366291bd1b9efe74fda837c7f1bd8dd3f7a56e16dde6b3cfd8386fc462a9f2cda08917f5c7173dae2e3674d030e98292b999112c5eeed5276"' }>
                                            <li class="link">
                                                <a href="components/CalculatorPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CalculatorPage</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ReferentielCalculatorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReferentielCalculatorComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/CalculatorPageModule.html" data-type="entity-link" >CalculatorPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ChangePasswordModule.html" data-type="entity-link" >ChangePasswordModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-ChangePasswordModule-7aaf0ddc45d00c5a4140867b54b8d66f90ba66568674f5e8d432fc5cc256784f1ab214ccea4820ce4adeb791bd64369af9fd6f3c068ee38f1425e68a1f96ec15"' : 'data-target="#xs-components-links-module-ChangePasswordModule-7aaf0ddc45d00c5a4140867b54b8d66f90ba66568674f5e8d432fc5cc256784f1ab214ccea4820ce4adeb791bd64369af9fd6f3c068ee38f1425e68a1f96ec15"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ChangePasswordModule-7aaf0ddc45d00c5a4140867b54b8d66f90ba66568674f5e8d432fc5cc256784f1ab214ccea4820ce4adeb791bd64369af9fd6f3c068ee38f1425e68a1f96ec15"' :
                                            'id="xs-components-links-module-ChangePasswordModule-7aaf0ddc45d00c5a4140867b54b8d66f90ba66568674f5e8d432fc5cc256784f1ab214ccea4820ce4adeb791bd64369af9fd6f3c068ee38f1425e68a1f96ec15"' }>
                                            <li class="link">
                                                <a href="components/ChangePassword.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChangePassword</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ChangePasswordPageModule.html" data-type="entity-link" >ChangePasswordPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ComponentsModule.html" data-type="entity-link" >ComponentsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-ComponentsModule-f733a63196d36a55cb12d2a0a1df59fedf68caee20498a1b62c110e8583f74c05850c12e5cdd3c98de0b43265e13767d90a4f0e0d5dd50061a7b61013a22db21"' : 'data-target="#xs-components-links-module-ComponentsModule-f733a63196d36a55cb12d2a0a1df59fedf68caee20498a1b62c110e8583f74c05850c12e5cdd3c98de0b43265e13767d90a4f0e0d5dd50061a7b61013a22db21"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ComponentsModule-f733a63196d36a55cb12d2a0a1df59fedf68caee20498a1b62c110e8583f74c05850c12e5cdd3c98de0b43265e13767d90a4f0e0d5dd50061a7b61013a22db21"' :
                                            'id="xs-components-links-module-ComponentsModule-f733a63196d36a55cb12d2a0a1df59fedf68caee20498a1b62c110e8583f74c05850c12e5cdd3c98de0b43265e13767d90a4f0e0d5dd50061a7b61013a22db21"' }>
                                            <li class="link">
                                                <a href="components/CoveragePreviewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CoveragePreviewComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DateSelectBlueComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DateSelectBlueComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DateSelectComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DateSelectComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DialWidgetComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DialWidgetComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DtesChartComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DtesChartComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EtpChartComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EtpChartComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EtpPreviewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EtpPreviewComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FiguresWidgetComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FiguresWidgetComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FooterNoConnectedComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FooterNoConnectedComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InOutChartComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InOutChartComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InputButtonComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InputButtonComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InputPercentageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InputPercentageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LegendLabelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LegendLabelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ListSelectionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListSelectionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoadersWidgetComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoadersWidgetComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OptionsBackupPanelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OptionsBackupPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PanelActivitiesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PanelActivitiesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PopupComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PopupComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProgressionBarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProgressionBarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RadioButtonComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RadioButtonComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SelectCheckAllComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SelectCheckAllComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SelectComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SelectComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SpeedometerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SpeedometerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TimeSelectorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TimeSelectorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TooltipsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TooltipsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WrapperComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WrapperComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WrapperNoConnectedComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WrapperNoConnectedComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/DashboardModule.html" data-type="entity-link" >DashboardModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-DashboardModule-fa9844cf2858dbe6b8e0e5047f39553fb7c03915ae583cc115033e893e552ad6be8ac3e35d0546fb432540a708e7e3345f6c308ec13ba998cf19c0db6f56e6f5"' : 'data-target="#xs-components-links-module-DashboardModule-fa9844cf2858dbe6b8e0e5047f39553fb7c03915ae583cc115033e893e552ad6be8ac3e35d0546fb432540a708e7e3345f6c308ec13ba998cf19c0db6f56e6f5"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-DashboardModule-fa9844cf2858dbe6b8e0e5047f39553fb7c03915ae583cc115033e893e552ad6be8ac3e35d0546fb432540a708e7e3345f6c308ec13ba998cf19c0db6f56e6f5"' :
                                            'id="xs-components-links-module-DashboardModule-fa9844cf2858dbe6b8e0e5047f39553fb7c03915ae583cc115033e893e552ad6be8ac3e35d0546fb432540a708e7e3345f6c308ec13ba998cf19c0db6f56e6f5"' }>
                                            <li class="link">
                                                <a href="components/DashboardPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DashboardPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/DashboardPageModule.html" data-type="entity-link" >DashboardPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ForgotPasswordModule.html" data-type="entity-link" >ForgotPasswordModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-ForgotPasswordModule-be25bcba7e50a5579f816391f89f00c7cfb66a34256ea3e18a33c049a9044db4f1dbd9e6ba3739ede591a3e7ba24c40c3449626d829714a847725240616bc94b"' : 'data-target="#xs-components-links-module-ForgotPasswordModule-be25bcba7e50a5579f816391f89f00c7cfb66a34256ea3e18a33c049a9044db4f1dbd9e6ba3739ede591a3e7ba24c40c3449626d829714a847725240616bc94b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ForgotPasswordModule-be25bcba7e50a5579f816391f89f00c7cfb66a34256ea3e18a33c049a9044db4f1dbd9e6ba3739ede591a3e7ba24c40c3449626d829714a847725240616bc94b"' :
                                            'id="xs-components-links-module-ForgotPasswordModule-be25bcba7e50a5579f816391f89f00c7cfb66a34256ea3e18a33c049a9044db4f1dbd9e6ba3739ede591a3e7ba24c40c3449626d829714a847725240616bc94b"' }>
                                            <li class="link">
                                                <a href="components/ForgotPassword.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ForgotPassword</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ForgotPasswordPageModule.html" data-type="entity-link" >ForgotPasswordPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/HomeModule.html" data-type="entity-link" >HomeModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-HomeModule-d97cbfaf19b08637fa9362af6bf443674ba3ed881992f78503d1d712d7ceee5680f9936221e59b28724105708cb54c8cc95fe1531c1363ebc5d823f2a8bd1ea5"' : 'data-target="#xs-components-links-module-HomeModule-d97cbfaf19b08637fa9362af6bf443674ba3ed881992f78503d1d712d7ceee5680f9936221e59b28724105708cb54c8cc95fe1531c1363ebc5d823f2a8bd1ea5"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-HomeModule-d97cbfaf19b08637fa9362af6bf443674ba3ed881992f78503d1d712d7ceee5680f9936221e59b28724105708cb54c8cc95fe1531c1363ebc5d823f2a8bd1ea5"' :
                                            'id="xs-components-links-module-HomeModule-d97cbfaf19b08637fa9362af6bf443674ba3ed881992f78503d1d712d7ceee5680f9936221e59b28724105708cb54c8cc95fe1531c1363ebc5d823f2a8bd1ea5"' }>
                                            <li class="link">
                                                <a href="components/HomePage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HomePage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/HomePageModule.html" data-type="entity-link" >HomePageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/HumanResourceModule.html" data-type="entity-link" >HumanResourceModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-HumanResourceModule-7261ddac16c06b4f94fb0f693b2bcebf820c743913376c3f9dcf51d5f6c1c7cb8ae0885d3125df2d306a7ead834c9fd1e93494f680ece27da619afab6a3919f7"' : 'data-target="#xs-components-links-module-HumanResourceModule-7261ddac16c06b4f94fb0f693b2bcebf820c743913376c3f9dcf51d5f6c1c7cb8ae0885d3125df2d306a7ead834c9fd1e93494f680ece27da619afab6a3919f7"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-HumanResourceModule-7261ddac16c06b4f94fb0f693b2bcebf820c743913376c3f9dcf51d5f6c1c7cb8ae0885d3125df2d306a7ead834c9fd1e93494f680ece27da619afab6a3919f7"' :
                                            'id="xs-components-links-module-HumanResourceModule-7261ddac16c06b4f94fb0f693b2bcebf820c743913376c3f9dcf51d5f6c1c7cb8ae0885d3125df2d306a7ead834c9fd1e93494f680ece27da619afab6a3919f7"' }>
                                            <li class="link">
                                                <a href="components/ActualPanelSituationComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ActualPanelSituationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AddVentilationComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddVentilationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/HumanResourcePage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HumanResourcePage</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PanelHistoryVentilationComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PanelHistoryVentilationComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/HumanResourcePageModule.html" data-type="entity-link" >HumanResourcePageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/LoginModule.html" data-type="entity-link" >LoginModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-LoginModule-bb18363812cd202723488b4869259377c8017a3eb30b716f8f616c75bb4188a7ada91cebd2bae3abfab9d2043302bd7e93c3854cf8d44ed0ad778841891cbba0"' : 'data-target="#xs-components-links-module-LoginModule-bb18363812cd202723488b4869259377c8017a3eb30b716f8f616c75bb4188a7ada91cebd2bae3abfab9d2043302bd7e93c3854cf8d44ed0ad778841891cbba0"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LoginModule-bb18363812cd202723488b4869259377c8017a3eb30b716f8f616c75bb4188a7ada91cebd2bae3abfab9d2043302bd7e93c3854cf8d44ed0ad778841891cbba0"' :
                                            'id="xs-components-links-module-LoginModule-bb18363812cd202723488b4869259377c8017a3eb30b716f8f616c75bb4188a7ada91cebd2bae3abfab9d2043302bd7e93c3854cf8d44ed0ad778841891cbba0"' }>
                                            <li class="link">
                                                <a href="components/LoginPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LoginPageModule.html" data-type="entity-link" >LoginPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/MaterialModule.html" data-type="entity-link" >MaterialModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/PipesModule.html" data-type="entity-link" >PipesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-PipesModule-a72646871c0e5b3ae58e7410dae8f66062d824635e350188f350d74a0916a81b7c042fd5274b8c9e86e0e0637d9e2775c669ca6cb633d7832626dfe8ecf24f97"' : 'data-target="#xs-components-links-module-PipesModule-a72646871c0e5b3ae58e7410dae8f66062d824635e350188f350d74a0916a81b7c042fd5274b8c9e86e0e0637d9e2775c669ca6cb633d7832626dfe8ecf24f97"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-PipesModule-a72646871c0e5b3ae58e7410dae8f66062d824635e350188f350d74a0916a81b7c042fd5274b8c9e86e0e0637d9e2775c669ca6cb633d7832626dfe8ecf24f97"' :
                                            'id="xs-components-links-module-PipesModule-a72646871c0e5b3ae58e7410dae8f66062d824635e350188f350d74a0916a81b7c042fd5274b8c9e86e0e0637d9e2775c669ca6cb633d7832626dfe8ecf24f97"' }>
                                            <li class="link">
                                                <a href="components/CoveragePreviewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CoveragePreviewComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DateSelectBlueComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DateSelectBlueComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DateSelectComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DateSelectComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DialWidgetComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DialWidgetComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DtesChartComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DtesChartComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EtpChartComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EtpChartComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EtpPreviewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EtpPreviewComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FiguresWidgetComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FiguresWidgetComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FooterNoConnectedComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FooterNoConnectedComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InOutChartComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InOutChartComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InputButtonComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InputButtonComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InputPercentageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InputPercentageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LegendLabelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LegendLabelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ListSelectionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListSelectionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoadersWidgetComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoadersWidgetComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OptionsBackupPanelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OptionsBackupPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PanelActivitiesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PanelActivitiesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PopupComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PopupComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProgressionBarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProgressionBarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RadioButtonComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RadioButtonComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SelectCheckAllComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SelectCheckAllComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SelectComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SelectComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SpeedometerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SpeedometerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TimeSelectorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TimeSelectorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TooltipsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TooltipsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WrapperComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WrapperComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WrapperNoConnectedComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WrapperNoConnectedComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ReaffectatorModule.html" data-type="entity-link" >ReaffectatorModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-ReaffectatorModule-a356c62d6dddd2270ca1fa7dfbb2f5fd24da8dd7423e1ccec818572f8480183cad39bd57c63c2067d1390f93cebc2c395d9a8ef03b9c88e111da6d83bc46af00"' : 'data-target="#xs-components-links-module-ReaffectatorModule-a356c62d6dddd2270ca1fa7dfbb2f5fd24da8dd7423e1ccec818572f8480183cad39bd57c63c2067d1390f93cebc2c395d9a8ef03b9c88e111da6d83bc46af00"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ReaffectatorModule-a356c62d6dddd2270ca1fa7dfbb2f5fd24da8dd7423e1ccec818572f8480183cad39bd57c63c2067d1390f93cebc2c395d9a8ef03b9c88e111da6d83bc46af00"' :
                                            'id="xs-components-links-module-ReaffectatorModule-a356c62d6dddd2270ca1fa7dfbb2f5fd24da8dd7423e1ccec818572f8480183cad39bd57c63c2067d1390f93cebc2c395d9a8ef03b9c88e111da6d83bc46af00"' }>
                                            <li class="link">
                                                <a href="components/ReaffectatorPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReaffectatorPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ReaffectatorPageModule.html" data-type="entity-link" >ReaffectatorPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SignupModule.html" data-type="entity-link" >SignupModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SignupModule-00430d1f4b407008ca7428f8eebfb34a8c7b347c3cbbc9e3f4d1659b239febce13d61202bda2036b2e71b7f179dd27e731cf2b731e1149a98fa1acdc9c83925b"' : 'data-target="#xs-components-links-module-SignupModule-00430d1f4b407008ca7428f8eebfb34a8c7b347c3cbbc9e3f4d1659b239febce13d61202bda2036b2e71b7f179dd27e731cf2b731e1149a98fa1acdc9c83925b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SignupModule-00430d1f4b407008ca7428f8eebfb34a8c7b347c3cbbc9e3f4d1659b239febce13d61202bda2036b2e71b7f179dd27e731cf2b731e1149a98fa1acdc9c83925b"' :
                                            'id="xs-components-links-module-SignupModule-00430d1f4b407008ca7428f8eebfb34a8c7b347c3cbbc9e3f4d1659b239febce13d61202bda2036b2e71b7f179dd27e731cf2b731e1149a98fa1acdc9c83925b"' }>
                                            <li class="link">
                                                <a href="components/SignupPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SignupPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SignupPageModule.html" data-type="entity-link" >SignupPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SimulatorModule.html" data-type="entity-link" >SimulatorModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SimulatorModule-b184a79f8ceb50e989232ac26669821f51aee4c7fb266f7f7fe5b1fb1fc43e7010ba926ac6f3c2dd0a97ca11ed13a0ae762ba981e6a6260f5d68fd558f188506"' : 'data-target="#xs-components-links-module-SimulatorModule-b184a79f8ceb50e989232ac26669821f51aee4c7fb266f7f7fe5b1fb1fc43e7010ba926ac6f3c2dd0a97ca11ed13a0ae762ba981e6a6260f5d68fd558f188506"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SimulatorModule-b184a79f8ceb50e989232ac26669821f51aee4c7fb266f7f7fe5b1fb1fc43e7010ba926ac6f3c2dd0a97ca11ed13a0ae762ba981e6a6260f5d68fd558f188506"' :
                                            'id="xs-components-links-module-SimulatorModule-b184a79f8ceb50e989232ac26669821f51aee4c7fb266f7f7fe5b1fb1fc43e7010ba926ac6f3c2dd0a97ca11ed13a0ae762ba981e6a6260f5d68fd558f188506"' }>
                                            <li class="link">
                                                <a href="components/SimulatorPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SimulatorPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SimulatorPageModule.html" data-type="entity-link" >SimulatorPageModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/WorkforceModule.html" data-type="entity-link" >WorkforceModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-WorkforceModule-5bbc61503585d2b0208a9c06c5607e1087d973387ebb198984069ab396e145041a173343c4d72d73e1388b718a069be9a190b4889b926d4b15917fcd5e07b98d"' : 'data-target="#xs-components-links-module-WorkforceModule-5bbc61503585d2b0208a9c06c5607e1087d973387ebb198984069ab396e145041a173343c4d72d73e1388b718a069be9a190b4889b926d4b15917fcd5e07b98d"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-WorkforceModule-5bbc61503585d2b0208a9c06c5607e1087d973387ebb198984069ab396e145041a173343c4d72d73e1388b718a069be9a190b4889b926d4b15917fcd5e07b98d"' :
                                            'id="xs-components-links-module-WorkforceModule-5bbc61503585d2b0208a9c06c5607e1087d973387ebb198984069ab396e145041a173343c4d72d73e1388b718a069be9a190b4889b926d4b15917fcd5e07b98d"' }>
                                            <li class="link">
                                                <a href="components/FilterPanelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilterPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkforcePage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkforcePage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/WorkforcePageModule.html" data-type="entity-link" >WorkforcePageModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#components-links"' :
                            'data-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/SelectCheckAllComponent.html" data-type="entity-link" >SelectCheckAllComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SelectComponent.html" data-type="entity-link" >SelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SpeedometerComponent.html" data-type="entity-link" >SpeedometerComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/MainClass.html" data-type="entity-link" >MainClass</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/ActivitiesService.html" data-type="entity-link" >ActivitiesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AppService.html" data-type="entity-link" >AppService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CalculatorService.html" data-type="entity-link" >CalculatorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContentieuxOptionsService.html" data-type="entity-link" >ContentieuxOptionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExcelService.html" data-type="entity-link" >ExcelService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HRCategoryService.html" data-type="entity-link" >HRCategoryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HRCommentService.html" data-type="entity-link" >HRCommentService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HRFonctionService.html" data-type="entity-link" >HRFonctionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HttpService.html" data-type="entity-link" >HttpService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HumanResourceService.html" data-type="entity-link" >HumanResourceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReaffectatorService.html" data-type="entity-link" >ReaffectatorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReferentielService.html" data-type="entity-link" >ReferentielService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SanitizeHtmlPipe.html" data-type="entity-link" >SanitizeHtmlPipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SanitizeResourceUrlPipe.html" data-type="entity-link" >SanitizeResourceUrlPipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SanitizeStylePipe.html" data-type="entity-link" >SanitizeStylePipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SanitizeUrlPipe.html" data-type="entity-link" >SanitizeUrlPipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ServerService.html" data-type="entity-link" >ServerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SimulatorService.html" data-type="entity-link" >SimulatorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WorkforceService.html" data-type="entity-link" >WorkforceService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#guards-links"' :
                            'data-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/AuthGuard.html" data-type="entity-link" >AuthGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ActionsInterface.html" data-type="entity-link" >ActionsInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ActivityInterface.html" data-type="entity-link" >ActivityInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AlertInterface.html" data-type="entity-link" >AlertInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BackupInterface.html" data-type="entity-link" >BackupInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CalculatorInterface.html" data-type="entity-link" >CalculatorInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChartAnnotationBoxInterface.html" data-type="entity-link" >ChartAnnotationBoxInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/childrenInterface.html" data-type="entity-link" >childrenInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentieuReferentielActivitiesInterface.html" data-type="entity-link" >ContentieuReferentielActivitiesInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentieuReferentielCalculateInterface.html" data-type="entity-link" >ContentieuReferentielCalculateInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentieuReferentielInterface.html" data-type="entity-link" >ContentieuReferentielInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentieuxOptionsInterface.html" data-type="entity-link" >ContentieuxOptionsInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/dataInterface.html" data-type="entity-link" >dataInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DocumentationInterface.html" data-type="entity-link" >DocumentationInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/etpAffectedInterface.html" data-type="entity-link" >etpAffectedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FilterPanelInterface.html" data-type="entity-link" >FilterPanelInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HistoryInterface.html" data-type="entity-link" >HistoryInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HRCategoryInterface.html" data-type="entity-link" >HRCategoryInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HRCategorySelectedInterface.html" data-type="entity-link" >HRCategorySelectedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HRFonctionInterface.html" data-type="entity-link" >HRFonctionInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HRSituationInterface.html" data-type="entity-link" >HRSituationInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HumanResourceInterface.html" data-type="entity-link" >HumanResourceInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HumanResourceSelectedInterface.html" data-type="entity-link" >HumanResourceSelectedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HumanResourceSelectedInterface-1.html" data-type="entity-link" >HumanResourceSelectedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ItemInterface.html" data-type="entity-link" >ItemInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/listFormatedInterface.html" data-type="entity-link" >listFormatedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/listFormatedInterface-1.html" data-type="entity-link" >listFormatedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NodeActivityUpdatedInterface.html" data-type="entity-link" >NodeActivityUpdatedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RHActivityInterface.html" data-type="entity-link" >RHActivityInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SimulationInterface.html" data-type="entity-link" >SimulationInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SimulatorInterface.html" data-type="entity-link" >SimulatorInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserInterface.html" data-type="entity-link" >UserInterface</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#pipes-links"' :
                                'data-target="#xs-pipes-links"' }>
                                <span class="icon ion-md-add"></span>
                                <span>Pipes</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="pipes-links"' : 'id="xs-pipes-links"' }>
                                <li class="link">
                                    <a href="pipes/SanitizeHtmlPipe.html" data-type="entity-link" >SanitizeHtmlPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/SanitizeResourceUrlPipe.html" data-type="entity-link" >SanitizeResourceUrlPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/SanitizeStylePipe.html" data-type="entity-link" >SanitizeStylePipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/SanitizeUrlPipe.html" data-type="entity-link" >SanitizeUrlPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/UcFirstPipe.html" data-type="entity-link" >UcFirstPipe</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});