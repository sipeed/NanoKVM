# NanoKVM Support Instructions

`/support` contains auxiliary functions for NanoKVM, such as image subsystem, system status monitoring, system updates, screen key drivers, and a few system functions.

Currently, NanoKVM is divided into two versions based on the main control chip: SG2002 (which includes NanoKVM-Lite/Full/PCIe) and H618 (including NanoKVM-Pro). Different chips have significantly different projects and compilation environments. To distinguish between them, they are stored separately in `/support/sg2002` and `/support/h618`.
