using System;
using System.IO;
using System.Windows;

namespace FretTabRunnerDesktop;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        AppDomain.CurrentDomain.UnhandledException += (s, ev) =>
        {
            LogException("AppDomain", ev.ExceptionObject as Exception);
        };

        DispatcherUnhandledException += (s, ev) =>
        {
            LogException("Dispatcher", ev.Exception);
        };

        base.OnStartup(e);
    }

    private static void LogException(string source, Exception? ex)
    {
        try
        {
            string logPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "frettabrunner_error.log");
            File.AppendAllText(logPath, $"[{DateTime.UtcNow:O}] [{source}] {ex?.ToString()}\n");
        }
        catch { }
    }
}
