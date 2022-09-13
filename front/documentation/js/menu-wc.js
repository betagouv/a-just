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
                                            'data-target="#components-links-module-AppModule-ce3765ff9194006193464a82a7cb0140e38c0a16f6e7ca70facb40a150249299f184270cb3a8578b2b44e3259088d26d41dffc0670ccad8890267a0bb0c91f72"' : 'data-target="#xs-components-links-module-AppModule-ce3765ff9194006193464a82a7cb0140e38c0a16f6e7ca70facb40a150249299f184270cb3a8578b2b44e3259088d26d41dffc0670ccad8890267a0bb0c91f72"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-ce3765ff9194006193464a82a7cb0140e38c0a16f6e7ca70facb40a150249299f184270cb3a8578b2b44e3259088d26d41dffc0670ccad8890267a0bb0c91f72"' :
                                            'id="xs-components-links-module-AppModule-ce3765ff9194006193464a82a7cb0140e38c0a16f6e7ca70facb40a150249299f184270cb3a8578b2b44e3259088d26d41dffc0670ccad8890267a0bb0c91f72"' }>
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
                                            'data-target="#components-links-module-CalculatorModule-86a59bdd5c921aefcdc10718472f52d002892e97b7d848fac8bc60ece8a36103bdcb0764e0940364055d6bec57f63cd30ea523b731de448c828f0055c261ee1f"' : 'data-target="#xs-components-links-module-CalculatorModule-86a59bdd5c921aefcdc10718472f52d002892e97b7d848fac8bc60ece8a36103bdcb0764e0940364055d6bec57f63cd30ea523b731de448c828f0055c261ee1f"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CalculatorModule-86a59bdd5c921aefcdc10718472f52d002892e97b7d848fac8bc60ece8a36103bdcb0764e0940364055d6bec57f63cd30ea523b731de448c828f0055c261ee1f"' :
                                            'id="xs-components-links-module-CalculatorModule-86a59bdd5c921aefcdc10718472f52d002892e97b7d848fac8bc60ece8a36103bdcb0764e0940364055d6bec57f63cd30ea523b731de448c828f0055c261ee1f"' }>
                                            <li class="link">
                                                <a href="components/CalculatorPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CalculatorPage</a>
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
                                            'data-target="#components-links-module-ChangePasswordModule-43bb56c9b4afa640497649ee7903f93b2c4e7123f48678a88a8ae7b07ab27f0cf2ac5ce596a6593024939b32e0ee302bc3886fbe7db816e71a14e751d5df47bf"' : 'data-target="#xs-components-links-module-ChangePasswordModule-43bb56c9b4afa640497649ee7903f93b2c4e7123f48678a88a8ae7b07ab27f0cf2ac5ce596a6593024939b32e0ee302bc3886fbe7db816e71a14e751d5df47bf"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ChangePasswordModule-43bb56c9b4afa640497649ee7903f93b2c4e7123f48678a88a8ae7b07ab27f0cf2ac5ce596a6593024939b32e0ee302bc3886fbe7db816e71a14e751d5df47bf"' :
                                            'id="xs-components-links-module-ChangePasswordModule-43bb56c9b4afa640497649ee7903f93b2c4e7123f48678a88a8ae7b07ab27f0cf2ac5ce596a6593024939b32e0ee302bc3886fbe7db816e71a14e751d5df47bf"' }>
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
                                            'data-target="#components-links-module-ComponentsModule-321ed7a0f95165a9dcbb718b9ec84195c01991906406d2424febea3945af07ac0e995fd54cd26ddd01cd39c2b03004b7681c8e0b2c90c2219d52ce5dc3b5e729"' : 'data-target="#xs-components-links-module-ComponentsModule-321ed7a0f95165a9dcbb718b9ec84195c01991906406d2424febea3945af07ac0e995fd54cd26ddd01cd39c2b03004b7681c8e0b2c90c2219d52ce5dc3b5e729"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ComponentsModule-321ed7a0f95165a9dcbb718b9ec84195c01991906406d2424febea3945af07ac0e995fd54cd26ddd01cd39c2b03004b7681c8e0b2c90c2219d52ce5dc3b5e729"' :
                                            'id="xs-components-links-module-ComponentsModule-321ed7a0f95165a9dcbb718b9ec84195c01991906406d2424febea3945af07ac0e995fd54cd26ddd01cd39c2b03004b7681c8e0b2c90c2219d52ce5dc3b5e729"' }>
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
                                                <a href="components/ReferentielCalculatorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReferentielCalculatorComponent</a>
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
                                            'data-target="#components-links-module-ForgotPasswordModule-e9d031a7c0cea0d5d68b1cbce607956ad7a15bd9ce5c85a1f7494dc0a9d19c697f0c578d37288fdce2b75bb683bab91f4187d79be63b9e18a75b54a9416a6f8f"' : 'data-target="#xs-components-links-module-ForgotPasswordModule-e9d031a7c0cea0d5d68b1cbce607956ad7a15bd9ce5c85a1f7494dc0a9d19c697f0c578d37288fdce2b75bb683bab91f4187d79be63b9e18a75b54a9416a6f8f"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ForgotPasswordModule-e9d031a7c0cea0d5d68b1cbce607956ad7a15bd9ce5c85a1f7494dc0a9d19c697f0c578d37288fdce2b75bb683bab91f4187d79be63b9e18a75b54a9416a6f8f"' :
                                            'id="xs-components-links-module-ForgotPasswordModule-e9d031a7c0cea0d5d68b1cbce607956ad7a15bd9ce5c85a1f7494dc0a9d19c697f0c578d37288fdce2b75bb683bab91f4187d79be63b9e18a75b54a9416a6f8f"' }>
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
                                            'data-target="#components-links-module-LoginModule-1fb615d9748a90163b52cba11714acec716294678644409cee01b21d2eaf8c7ba5ce8e9214b6650acc8bebcd04a2bc1eebab2572ecfc71cb2040d81374016068"' : 'data-target="#xs-components-links-module-LoginModule-1fb615d9748a90163b52cba11714acec716294678644409cee01b21d2eaf8c7ba5ce8e9214b6650acc8bebcd04a2bc1eebab2572ecfc71cb2040d81374016068"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LoginModule-1fb615d9748a90163b52cba11714acec716294678644409cee01b21d2eaf8c7ba5ce8e9214b6650acc8bebcd04a2bc1eebab2572ecfc71cb2040d81374016068"' :
                                            'id="xs-components-links-module-LoginModule-1fb615d9748a90163b52cba11714acec716294678644409cee01b21d2eaf8c7ba5ce8e9214b6650acc8bebcd04a2bc1eebab2572ecfc71cb2040d81374016068"' }>
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
                                                <a href="components/ReferentielCalculatorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReferentielCalculatorComponent</a>
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
                                            'data-target="#components-links-module-SignupModule-4a2c753323ffafd88c3f261a8bc9d384cce17486113b1a4cb8a024f568fbe6d437baf3aed4e0d63f41db84afa9bafe76791457742c67548f6e67db1ad3a140de"' : 'data-target="#xs-components-links-module-SignupModule-4a2c753323ffafd88c3f261a8bc9d384cce17486113b1a4cb8a024f568fbe6d437baf3aed4e0d63f41db84afa9bafe76791457742c67548f6e67db1ad3a140de"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SignupModule-4a2c753323ffafd88c3f261a8bc9d384cce17486113b1a4cb8a024f568fbe6d437baf3aed4e0d63f41db84afa9bafe76791457742c67548f6e67db1ad3a140de"' :
                                            'id="xs-components-links-module-SignupModule-4a2c753323ffafd88c3f261a8bc9d384cce17486113b1a4cb8a024f568fbe6d437baf3aed4e0d63f41db84afa9bafe76791457742c67548f6e67db1ad3a140de"' }>
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
                                <a href="interfaces/etpAffectedInterface.html" data-type="entity-link" >etpAffectedInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FilterPanelInterface.html" data-type="entity-link" >FilterPanelInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FirstETPTargetValueInterface.html" data-type="entity-link" >FirstETPTargetValueInterface</a>
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