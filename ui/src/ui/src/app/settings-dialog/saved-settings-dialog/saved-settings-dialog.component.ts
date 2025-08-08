import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-saved-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './saved-settings-dialog.component.html',
})
export class SavedSettingsDialogComponent implements OnInit {
  savedSettingsList: Array<{ brandName: string; logo: string; primaryColor: string }> = [];

  constructor(
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SavedSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentSettings: any }
  ) { }

  ngOnInit() {
    this.loadSavedSettingsList();
  }

  loadSavedSettingsList() {
    const list = localStorage.getItem('uiSavedSettingsList');
    this.savedSettingsList = list ? JSON.parse(list) : [];
  }

  deleteSavedSetting(index: number) {
    this.savedSettingsList.splice(index, 1);
    localStorage.setItem('uiSavedSettingsList', JSON.stringify(this.savedSettingsList));
  }

  applySavedSetting(index: number) {
    const setting = this.savedSettingsList[index];
    localStorage.setItem('uiPersonalizationSettings', JSON.stringify(setting));
    this.snackBar.open('Applied saved setting!', 'Close', { duration: 2000 });
    this.dialogRef.close({ applied: true, settings: setting });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
