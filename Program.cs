using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net.NetworkInformation;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace NetworkScanner
{
    class NetworkScannerProgram
    {
        private const int START_IP = 1;
        private const int END_IP = 254;
        private const int MAX_THREADS = 64;
        private const string TARGET_MAC_PREFIX = "48-DA-35";

        static void PingIp(string ip)
        {
            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = "ping",
                Arguments = $"-n 1 -w 100 {ip}",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using (Process process = Process.Start(psi))
            {
                process.WaitForExit();
            }
        }

        static void LaunchBrowser(string ipAddress)
        {
            string url = $"http://{ipAddress}";
            Console.WriteLine($"Launching browser to {url}...");
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }

        private static string GetLocalSubnet()
        {
            var adapters = new List<(string Name, string Subnet)>();

            foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus == OperationalStatus.Up &&
                    ni.NetworkInterfaceType != NetworkInterfaceType.Loopback)
                {
                    foreach (UnicastIPAddressInformation ip in ni.GetIPProperties().UnicastAddresses)
                    {
                        if (ip.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                        {
                            string[] octets = ip.Address.ToString().Split('.');
                            if (octets.Length == 4)
                            {
                                string subnet = $"{octets[0]}.{octets[1]}.{octets[2]}.";
                                adapters.Add(($"{ni.Name} ({ip.Address})", subnet));
                            }
                        }
                    }
                }
            }

            if (adapters.Count == 0)
                return null;
            if (adapters.Count == 1)
                return adapters[0].Subnet;

            Console.WriteLine("Multiple network adapters found:");
            for (int i = 0; i < adapters.Count; i++)
            {
                Console.WriteLine($"{i + 1}: {adapters[i].Name}");
            }
            Console.Write("Select an adapter to use (enter number): ");
            string input = Console.ReadLine();
            if (int.TryParse(input, out int selection) && selection >= 1 && selection <= adapters.Count)
            {
                return adapters[selection - 1].Subnet;
            }
            Console.WriteLine("Invalid selection.");
            return null;
        }

        static async Task Main(string[] args)
        {
            string subnet = GetLocalSubnet();
            if (string.IsNullOrEmpty(subnet))
            {
                Console.WriteLine("Could not detect local subnet.");
                return;
            }


            Console.WriteLine($"Pinging subnet {subnet}0/24 to populate ARP table...");

            // Thread limiting using Semaphore
            SemaphoreSlim semaphore = new SemaphoreSlim(MAX_THREADS, MAX_THREADS);
            List<Task> tasks = new List<Task>();

            for (int i = START_IP; i <= END_IP; i++)
            {
                await semaphore.WaitAsync(); // Wait until a thread is available
                string ipAddress = $"{subnet}{i}";

                tasks.Add(Task.Run(() =>
                {
                    try
                    {
                        PingIp(ipAddress);
                    }
                    finally
                    {
                        semaphore.Release(); // Release the thread
                    }
                }));
            }

            await Task.WhenAll(tasks); // Wait for all tasks to complete

            Console.WriteLine("Scanning ARP table for MAC addresses starting with 48:DA:35...\n");

            ProcessStartInfo arpPsi = new ProcessStartInfo
            {
                FileName = "arp",
                Arguments = "-a",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            List<string> foundIps = new List<string>();
            using (Process arpProcess = Process.Start(arpPsi))
            {
                string arpOutput = arpProcess.StandardOutput.ReadToEnd();
                arpProcess.WaitForExit();

                string pattern = @"(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-fA-F-]+)";
                MatchCollection matches = Regex.Matches(arpOutput, pattern);

                foreach (Match match in matches)
                {
                    string ip = match.Groups[1].Value;
                    string mac = match.Groups[2].Value;

                    if (mac.StartsWith(TARGET_MAC_PREFIX, StringComparison.OrdinalIgnoreCase))
                    {
                        Console.WriteLine("\nsiSpeed MAC 48-DA-35 found!");
                        Console.WriteLine($"FOUND: IP: {ip}  MAC: {mac}\n");
                        foundIps.Add(ip);
                    }
                }
            }

            if (foundIps.Count == 1)
            {
                LaunchBrowser(foundIps[0]);
            }
            else if (foundIps.Count > 1)
            {
                Console.WriteLine("Multiple devices found:");
                for (int i = 0; i < foundIps.Count; i++)
                {
                    Console.WriteLine($"{i + 1}: {foundIps[i]}");
                }
                Console.Write("Select a device to launch (enter number): ");
                string input = Console.ReadLine();
                if (int.TryParse(input, out int selection) && selection >= 1 && selection <= foundIps.Count)
                {
                    LaunchBrowser(foundIps[selection - 1]);
                }
                else
                {
                    Console.WriteLine("Invalid selection. Exiting.");
                }
            }
            else
            {
                Console.WriteLine("No device with MAC 48:DA:35 found on this subnet.");
            }

        }
    }
}
