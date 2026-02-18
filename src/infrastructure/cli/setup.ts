import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';
import { serveCommand } from './commands/serve.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('automation-reporter')
    .description('CLI para generar reportes estadísticos de logs de automatización')
    .version('1.0.0');

  program.addCommand(generateCommand);
  program.addCommand(serveCommand);

  return program;
}
