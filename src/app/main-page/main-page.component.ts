import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { v4 as uuid } from "uuid";
import { AlertifyService } from "../services/alertify.service";
import { EosService } from "../services/eos.service";
import { ChangeDetectionStrategy } from "@angular/core/src/render3/jit/compiler_facade_interface";

@Component({
  selector: "app-main-page",
  templateUrl: "./main-page.component.html",
  styleUrls: ["./main-page.component.scss"],
})
/****************************************************************************************************
 ****************************************************************************************************
 ****************************************************************************************************
 * @ngdoc class                                                                                   ***
 * @name MainPageComponent                                                                        ***
 * @module components.main-page.module                                                            ***
 * @requires EosService                                                                           ***
 * @description Load Personal Data from database verified by blockchain.                          ***
 * ## The data is presented on a screen in form of a animated sequence of frames                  ***
 ****************************************************************************************************
 **********************************************************ª*****************************************/
export class MainPageComponent implements OnInit {
  @BlockUI() blockUI: NgBlockUI;
  alertId: string = uuid();

  constructor(
    private activatedRoute: ActivatedRoute,
    private eosService: EosService,
    private alertify: AlertifyService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.alertify.alertId = this.alertId;
  }

  opened: boolean = false;

  id: any;
  frames: any;
  img: any;
  minTime: any;
  maxTime: any;

  delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.alertify.clear();
    const delay = (ms: any) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    this.activatedRoute.paramMap.subscribe((params) => {
      this.minTime = params.get("minTime");
      this.maxTime = params.get("maxTime");
    });
    this.activatedRoute.data.subscribe(async (response: any) => {
      this.blockUI.stop();
      if (response["record"] && response["record"].data) {
        const history = await this.eosService.getHistoryRows();
        const data = response["record"].data;
        let historyArray: any = [];
        if (history && history.rows) {
          for (let i = 0; i < history.rows.length; i++) {
            if (
              history.rows[i].minTime === this.maxTime &&
              history.rows[i].stamp_secs >= this.minTime
            ) {
              historyArray.push(history.rows[i]);
            }
          }
        }

        this.minTime = data.minTime;
        this.maxTime = data.maxTime;
        this.frames = data.frames;
        if (data.error && data.error.code === "hash.failure") {
          this.alertify.clear();
          this.alertify.warn(data.error.message, true);
        }
        for (let i = 0; i < this.frames.length; i++) {
          await delay(150);
          this.img = "data:image/jpeg;base64," + this.frames[i];
        }
      }
    });
  }

  /**
   * Removes Frames previously displayed on screen
   * @param {*} minTime
   * @param {*} maxTime
   * Specifies times between first and last frames
   */
  removeFrames() {
    this.blockUI.start();
    this.eosService.removeFrames(this.minTime, this.maxTime).then(
      async (data: any) => {
        this.blockUI.stop();
        this.alertify.clear();
        this.alertify.success("main-page.removal.success", true);
        await this.delay(2000);
        this.router.navigate(["home"]);
      },
      (error) => {
        this.blockUI.stop();
        if (error && error.type == "signature_rejected") {
        } else {
          this.alertify.clear();
          this.alertify.error("generic.error.transaction", true);
        }
      }
    );
  }
}
