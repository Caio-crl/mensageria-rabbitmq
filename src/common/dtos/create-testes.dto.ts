import { IsNotEmpty, Matches } from 'class-validator';

export class CreatetestesDto {

  @IsNotEmpty()
  readonly nome: string;

  @IsNotEmpty()
  @Matches(/^[a-z\d._](?!.*\.git$)[a-z\d._-]{0,98}[a-z\d_-]$/i, {
    message: 'O codigo deve conter apenas letras, números e hífens.',
  })
  readonly codigo: string;

  @IsNotEmpty()
  readonly descricao: string;

}
