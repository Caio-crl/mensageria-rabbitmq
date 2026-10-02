import { Module } from "@nestjs/common";
import { CommonModule } from "./common/common.module"
import { AppService } from 'src/common/app.service';
import { ApiModule } from "./api/api.module";
import { WorkerModule } from "./worker/worker.module";


@Module({
  imports: [
    CommonModule,
    ApiModule,
    WorkerModule,
  ],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}
