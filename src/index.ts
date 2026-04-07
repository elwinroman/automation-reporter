#!/usr/bin/env node
import './core/environment.js'
import { createCli } from './infrastructure/cli/setup.js'

const program = createCli()
program.parse()
